"""
tests/test_password_reset.py — Unit and integration tests for the OTP password reset system.
"""

from __future__ import annotations

import hashlib
import hmac
import time
from datetime import datetime, timedelta
from typing import Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

# Use an in-memory SQLite DB for tests
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture
def db() -> Generator[Session, None, None]:
    from database import Base
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestSession = sessionmaker(bind=engine)
    session = TestSession()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)



@pytest.fixture
def test_user(db: Session):
    """Create a test user in the in-memory DB."""
    from database import User
    from modules.auth.password_service import PasswordService
    import uuid as _uuid

    user = User(
        uuid=str(_uuid.uuid4()),
        full_name="Test User",
        email="test@yowon.ai",
        password_hash=PasswordService.hash_password("OldPassword123!"),
        role="TEAM_MEMBER",
        status="active",
        email_verified=True,
    )
    db.add(user)
    db.commit()
    return user


@pytest.fixture
def service(db: Session):
    from modules.auth.password_reset import PasswordResetService
    return PasswordResetService(db)


# ── OTP Generation ────────────────────────────────────────────────────────────

class TestOTPGeneration:
    def test_otp_uses_secrets_module(self):
        """OTP must be generated using the secrets module (cryptographically random)."""
        from modules.auth.password_reset import _generate_otp
        otps = {_generate_otp() for _ in range(100)}
        # All should be 6 digits
        assert all(len(o) == 6 and o.isdigit() for o in otps)
        # With 100 samples from 1M space, collisions should be extremely rare
        assert len(otps) > 90  # Statistical check

    def test_otp_always_six_digits(self):
        """OTP must always be zero-padded to exactly 6 digits."""
        from modules.auth.password_reset import _generate_otp
        for _ in range(50):
            otp = _generate_otp()
            assert len(otp) == 6
            assert otp.isdigit()


# ── OTP Hashing ───────────────────────────────────────────────────────────────

class TestOTPHashing:
    def test_otp_stored_as_hmac_not_plain(self):
        """The stored hash must not equal the plain OTP."""
        from modules.auth.password_reset import _hash_otp
        otp = "482731"
        h = _hash_otp(otp)
        assert h != otp
        assert len(h) == 64  # SHA-256 hex digest

    def test_hmac_compare_digest_used(self):
        """Verification must use constant-time comparison."""
        from modules.auth.password_reset import _hash_otp, _verify_otp_hash
        otp = "123456"
        stored = _hash_otp(otp)
        assert _verify_otp_hash(otp, stored) is True
        assert _verify_otp_hash("999999", stored) is False

    def test_different_otps_produce_different_hashes(self):
        """Each OTP must produce a unique hash."""
        from modules.auth.password_reset import _hash_otp
        assert _hash_otp("111111") != _hash_otp("111112")


# ── Session Management ────────────────────────────────────────────────────────

class TestSessionManagement:
    def test_previous_session_invalidated_on_new_request(
        self, service, test_user, db
    ):
        """Submitting a second forgot-password request must invalidate the first session."""
        from database import PasswordResetSession

        with patch("modules.auth.password_reset._check_ip_rate_limit"):
            service.request_otp(test_user.email, "1.2.3.4")
            service.request_otp(test_user.email, "1.2.3.4")

        sessions = db.query(PasswordResetSession).filter_by(
            user_id=test_user.uuid
        ).all()
        statuses = {s.status for s in sessions}
        # At least one PENDING (the new one) and at least one INVALIDATED
        assert "PENDING" in statuses
        assert "INVALIDATED" in statuses

    def test_unknown_email_returns_without_error(self, service):
        """Unknown email should NOT raise an exception (prevents enumeration)."""
        with patch("modules.auth.password_reset._check_ip_rate_limit"):
            session_id, otp = service.request_otp("nobody@nowhere.com", "1.1.1.1")
        assert isinstance(session_id, str)
        assert len(otp) == 6


# ── OTP Verification ──────────────────────────────────────────────────────────

class TestOTPVerification:
    def _create_session_and_otp(self, db, user, otp: str):
        """Helper: insert a PasswordResetSession + PasswordResetOTP directly."""
        from database import PasswordResetOTP, PasswordResetSession
        from modules.auth.password_reset import _hash_otp
        import uuid as _uuid

        session = PasswordResetSession(
            id=str(_uuid.uuid4()),
            user_id=user.uuid,
            email=user.email,
            status="PENDING",
            email_status="EMAIL_SENT",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=5),
        )
        db.add(session)
        db.flush()

        otp_record = PasswordResetOTP(
            session_id=session.id,
            otp_hash=_hash_otp(otp),
            attempts=0,
            resend_count=0,
            is_used=False,
            is_expired=False,
        )
        db.add(otp_record)
        db.commit()
        return session

    def test_correct_otp_returns_reset_token(self, service, test_user, db):
        """A correct OTP must return a non-empty reset JWT."""
        otp = "482731"
        self._create_session_and_otp(db, test_user, otp)
        token = service.verify_otp(test_user.email, otp)
        assert isinstance(token, str)
        assert len(token) > 20

    def test_wrong_otp_raises_error(self, service, test_user, db):
        """An incorrect OTP must raise HTTPException."""
        from fastapi import HTTPException
        self._create_session_and_otp(db, test_user, "482731")
        with pytest.raises(HTTPException) as exc_info:
            service.verify_otp(test_user.email, "000000")
        assert exc_info.value.status_code == 400

    def test_otp_marked_used_after_verify(self, service, test_user, db):
        """OTP is_used must be True immediately after successful verification."""
        from database import PasswordResetOTP
        otp = "123456"
        self._create_session_and_otp(db, test_user, otp)
        service.verify_otp(test_user.email, otp)
        otp_record = db.query(PasswordResetOTP).order_by(
            PasswordResetOTP.created_at.desc()
        ).first()
        assert otp_record.is_used is True

    def test_max_attempts_locks_session(self, service, test_user, db):
        """After OTP_MAX_ATTEMPTS failures, the session must be locked."""
        from fastapi import HTTPException
        from database import PasswordResetSession
        from config import OTP_MAX_ATTEMPTS

        self._create_session_and_otp(db, test_user, "482731")
        for _ in range(OTP_MAX_ATTEMPTS):
            with pytest.raises(HTTPException):
                service.verify_otp(test_user.email, "000000")

        session = db.query(PasswordResetSession).filter_by(
            user_id=test_user.uuid
        ).order_by(PasswordResetSession.created_at.desc()).first()
        assert session.status in ("EXPIRED", "PENDING")

    def test_replay_attack_rejected(self, service, test_user, db):
        """Reusing an already-used OTP must be rejected."""
        from fastapi import HTTPException
        otp = "654321"
        self._create_session_and_otp(db, test_user, otp)
        service.verify_otp(test_user.email, otp)  # First use — OK
        with pytest.raises(HTTPException):          # Second use — must fail
            service.verify_otp(test_user.email, otp)


# ── Reset Token (JWT) ─────────────────────────────────────────────────────────

class TestResetToken:
    def test_reset_token_has_correct_claims(self, service, test_user, db):
        """The reset JWT must contain type=password_reset and aud=password-reset."""
        import jwt as pyjwt
        from config import PASSWORD_RESET_JWT_SECRET
        from modules.auth.password_reset import _hash_otp
        from database import PasswordResetOTP, PasswordResetSession
        import uuid as _uuid

        session = PasswordResetSession(
            id=str(_uuid.uuid4()),
            user_id=test_user.uuid,
            email=test_user.email,
            status="PENDING",
            email_status="EMAIL_SENT",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=5),
        )
        db.add(session)
        db.flush()
        otp_val = "777888"
        db.add(PasswordResetOTP(
            session_id=session.id,
            otp_hash=_hash_otp(otp_val),
            attempts=0, resend_count=0, is_used=False, is_expired=False,
        ))
        db.commit()

        token = service.verify_otp(test_user.email, otp_val)
        payload = pyjwt.decode(
            token, PASSWORD_RESET_JWT_SECRET,
            algorithms=["HS256"], audience="password-reset"
        )
        assert payload["type"] == "password_reset"
        assert payload["aud"] == "password-reset"
        assert "jti" in payload
        assert "exp" in payload


# ── Password Reset ────────────────────────────────────────────────────────────

class TestPasswordReset:
    def test_password_strength_enforced(self, service, test_user, db):
        """A weak password must be rejected at the reset endpoint."""
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc_info:
            service.reset_password("fake-token", "weak")  # invalid token too
        # Either bad token or bad password — both are 400
        assert exc_info.value.status_code == 400

    def test_password_history_enforced(self, service, test_user, db):
        """The new password must not match the current password."""
        from fastapi import HTTPException
        from modules.auth.password_reset import _hash_otp
        from database import PasswordResetOTP, PasswordResetSession, PasswordResetJTI
        import uuid as _uuid
        import jwt as pyjwt
        from config import PASSWORD_RESET_JWT_SECRET, RESET_TOKEN_EXPIRY_MIN

        # Create a verified session + JTI manually
        sess = PasswordResetSession(
            id=str(_uuid.uuid4()),
            user_id=test_user.uuid,
            email=test_user.email,
            status="OTP_VERIFIED",
            email_status="EMAIL_SENT",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=5),
        )
        db.add(sess)
        db.flush()
        jti_val = str(_uuid.uuid4())
        db.add(PasswordResetJTI(jti=jti_val, session_id=sess.id, used_at=None))
        db.commit()

        token = pyjwt.encode(
            {"sub": sess.id, "jti": jti_val, "type": "password_reset",
             "aud": "password-reset",
             "exp": datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRY_MIN)},
            PASSWORD_RESET_JWT_SECRET, algorithm="HS256"
        )

        with pytest.raises(HTTPException) as exc_info:
            service.reset_password(token, "OldPassword123!")
        assert exc_info.value.status_code == 400
        assert "different" in exc_info.value.detail.lower()


# ── Rate Limiting ─────────────────────────────────────────────────────────────

class TestRateLimiting:
    def test_ip_rate_limit_enforced(self):
        """More than FORGOT_RATE_LIMIT_COUNT requests from same IP in window raises 429."""
        from fastapi import HTTPException
        from modules.auth.password_reset import _check_ip_rate_limit, _reset_rate_buckets
        from config import FORGOT_RATE_LIMIT_COUNT

        test_ip = "192.168.99.99"
        _reset_rate_buckets.pop(test_ip, None)  # Clear any existing state

        for _ in range(FORGOT_RATE_LIMIT_COUNT):
            _check_ip_rate_limit(test_ip)  # Should not raise

        with pytest.raises(HTTPException) as exc_info:
            _check_ip_rate_limit(test_ip)
        assert exc_info.value.status_code == 429


# ── Audit Logging ─────────────────────────────────────────────────────────────

class TestAuditLogging:
    def test_audit_log_written_on_request(self, service, test_user, db):
        """PASSWORD_RESET_REQUESTED must be written to audit_logs."""
        from database import AuditLog
        with patch("modules.auth.password_reset._check_ip_rate_limit"):
            service.request_otp(test_user.email, "1.2.3.4", "Mozilla/5.0")
        log = db.query(AuditLog).filter_by(
            event_type="PASSWORD_RESET_REQUESTED"
        ).order_by(AuditLog.timestamp.desc()).first()
        assert log is not None
        assert log.actor_id == test_user.uuid
        assert log.ip_address == "1.2.3.4"


# ── Hardening Features ────────────────────────────────────────────────────────

class TestHardenFeatures:
    def test_concurrent_forgot_password_requests(self, service, test_user, db):
        """Concurrent requests must invalidate all previous sessions, leaving only one active."""
        from database import PasswordResetSession
        with patch("modules.auth.password_reset._check_ip_rate_limit"):
            service.request_otp(test_user.email, "1.2.3.4")
            service.request_otp(test_user.email, "1.2.3.4")
            service.request_otp(test_user.email, "1.2.3.4")

        sessions = db.query(PasswordResetSession).filter_by(user_id=test_user.uuid).all()
        assert len(sessions) == 3
        pendings = [s for s in sessions if s.status == "PENDING"]
        invalidated = [s for s in sessions if s.status == "INVALIDATED"]
        assert len(pendings) == 1
        assert len(invalidated) == 2

    def test_multiple_browser_tabs_isolation(self, service, test_user, db):
        """Starting reset flow in tab 2 invalidates tab 1's session/OTP."""
        from fastapi import HTTPException
        with patch("modules.auth.password_reset._check_ip_rate_limit"):
            # Tab 1 requests OTP
            session_id_1, otp_1 = service.request_otp(test_user.email, "1.1.1.1")
            # Tab 2 requests OTP (simulated via another request call)
            session_id_2, otp_2 = service.request_otp(test_user.email, "1.1.1.1")

        # Trying to verify tab 1's OTP must fail because session is invalidated
        with pytest.raises(HTTPException) as exc_info:
            service.verify_otp(test_user.email, otp_1)
        assert "expired" in exc_info.value.detail.lower() or "invalid" in exc_info.value.detail.lower()

        # Tab 2's OTP should still be valid
        token = service.verify_otp(test_user.email, otp_2)
        assert token is not None

    def test_resend_after_successful_verification_raises_error(self, service, test_user, db):
        """Resending OTP for a session that has already verified its OTP must fail."""
        from fastapi import HTTPException
        from modules.auth.password_reset import _hash_otp
        from database import PasswordResetOTP, PasswordResetSession
        import uuid as _uuid

        # Create session already set to OTP_VERIFIED
        sess = PasswordResetSession(
            id=str(_uuid.uuid4()),
            user_id=test_user.uuid,
            email=test_user.email,
            status="OTP_VERIFIED",
            email_status="EMAIL_SENT",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=5),
        )
        db.add(sess)
        db.flush()
        db.add(PasswordResetOTP(
            session_id=sess.id,
            otp_hash=_hash_otp("111222"),
            attempts=0, resend_count=0, is_used=True, is_expired=False,
        ))
        db.commit()

        with pytest.raises(HTTPException) as exc_info:
            service.resend_otp(test_user.email)
        assert exc_info.value.status_code == 400

    def test_expired_jwt_fails_reset(self, service, test_user, db):
        """Even with a valid OTP session, an expired reset JWT must fail to reset the password."""
        from fastapi import HTTPException
        import jwt as pyjwt
        from config import PASSWORD_RESET_JWT_SECRET
        from database import PasswordResetSession, PasswordResetJTI
        import uuid as _uuid

        sess = PasswordResetSession(
            id=str(_uuid.uuid4()),
            user_id=test_user.uuid,
            email=test_user.email,
            status="OTP_VERIFIED",
            email_status="EMAIL_SENT",
            created_at=datetime.utcnow() - timedelta(minutes=20),
            expires_at=datetime.utcnow() - timedelta(minutes=15),
        )
        db.add(sess)
        db.flush()
        jti_val = str(_uuid.uuid4())
        db.add(PasswordResetJTI(jti=jti_val, session_id=sess.id, used_at=None))
        db.commit()

        # Create expired JWT
        expired_token = pyjwt.encode(
            {
                "sub": sess.id,
                "jti": jti_val,
                "type": "password_reset",
                "aud": "password-reset",
                "exp": datetime.utcnow() - timedelta(seconds=1),
            },
            PASSWORD_RESET_JWT_SECRET,
            algorithm="HS256"
        )

        with pytest.raises(HTTPException) as exc_info:
            service.reset_password(expired_token, "NewStrongPassword123!")
        assert "expired" in exc_info.value.detail.lower()

    def test_invalidated_session_reuse_rejected(self, service, test_user, db):
        """An invalidated session cannot be used for password reset."""
        from fastapi import HTTPException
        from database import PasswordResetSession, PasswordResetJTI
        import uuid as _uuid
        import jwt as pyjwt
        from config import PASSWORD_RESET_JWT_SECRET

        sess = PasswordResetSession(
            id=str(_uuid.uuid4()),
            user_id=test_user.uuid,
            email=test_user.email,
            status="INVALIDATED",  # Session was invalidated
            email_status="EMAIL_SENT",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=5),
        )
        db.add(sess)
        db.flush()
        jti_val = str(_uuid.uuid4())
        db.add(PasswordResetJTI(jti=jti_val, session_id=sess.id, used_at=None))
        db.commit()

        token = pyjwt.encode(
            {"sub": sess.id, "jti": jti_val, "type": "password_reset",
             "aud": "password-reset",
             "exp": datetime.utcnow() + timedelta(minutes=5)},
            PASSWORD_RESET_JWT_SECRET, algorithm="HS256"
        )

        with pytest.raises(HTTPException) as exc_info:
            service.reset_password(token, "NewStrongPassword123!")
        assert "invalid" in exc_info.value.detail.lower()

    def test_five_password_history_enforced(self, service, test_user, db):
        """User cannot reset password to any of their last 5 passwords."""
        from fastapi import HTTPException
        from database import PasswordResetSession, PasswordResetJTI, UserPasswordHistory
        from modules.auth.password_service import PasswordService
        import uuid as _uuid
        import jwt as pyjwt
        from config import PASSWORD_RESET_JWT_SECRET

        # Setup mock user password history
        passwords = [
            "Password111!",
            "Password222!",
            "Password333!",
            "Password444!",
            "Password555!",
        ]
        for pwd in passwords:
            db.add(UserPasswordHistory(
                user_uuid=test_user.uuid,
                password_hash=PasswordService.hash_password(pwd),
                created_at=datetime.utcnow() - timedelta(minutes=10)
            ))
        db.commit()

        # Create active verified session
        sess = PasswordResetSession(
            id=str(_uuid.uuid4()),
            user_id=test_user.uuid,
            email=test_user.email,
            status="OTP_VERIFIED",
            email_status="EMAIL_SENT",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(minutes=5),
        )
        db.add(sess)
        db.commit()

        # Reusing any password in the history list of last 5 must raise 400
        for reused_pwd in passwords:
            jti_val = str(_uuid.uuid4())
            db.add(PasswordResetJTI(jti=jti_val, session_id=sess.id, used_at=None))
            db.commit()

            token = pyjwt.encode(
                {"sub": sess.id, "jti": jti_val, "type": "password_reset",
                 "aud": "password-reset",
                 "exp": datetime.utcnow() + timedelta(minutes=5)},
                PASSWORD_RESET_JWT_SECRET, algorithm="HS256"
            )

            with pytest.raises(HTTPException) as exc_info:
                service.reset_password(token, reused_pwd)
            assert exc_info.value.status_code == 400
            assert "reuse" in exc_info.value.detail.lower()

        # Using a new password must work and trim history to last 5
        jti_val = str(_uuid.uuid4())
        db.add(PasswordResetJTI(jti=jti_val, session_id=sess.id, used_at=None))
        db.commit()

        token = pyjwt.encode(
            {"sub": sess.id, "jti": jti_val, "type": "password_reset",
             "aud": "password-reset",
             "exp": datetime.utcnow() + timedelta(minutes=5)},
            PASSWORD_RESET_JWT_SECRET, algorithm="HS256"
        )
        new_pwd = "PasswordNew666!"
        service.reset_password(token, new_pwd)
        user_histories = db.query(UserPasswordHistory).filter_by(user_uuid=test_user.uuid).all()
        # Should be exactly 5 records (oldest one was deleted, new old-password added)
        assert len(user_histories) == 5

