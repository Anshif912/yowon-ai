"""
modules/auth/password_reset.py — Enterprise OTP Password Reset Service.

Architecture:
    PasswordResetSession  (one per reset flow, one active per user)
        └── PasswordResetOTP  (one per send/resend)
    PasswordResetJTI  (one per reset JWT — single-use enforcement)

Security:
    - OTP generated with `secrets` module
    - HMAC-SHA256 with server-side pepper — resists offline brute-force
    - Constant-time comparison via `hmac.compare_digest`
    - One active session per user (previous sessions invalidated)
    - Resend rate limit: 3 resends, 60-second cooldown
    - IP-level rate limit: 5 requests/hour via existing _rate_buckets
    - Session abuse: max 5 sessions/hour per user
    - JWT replay protection via PasswordResetJTI table
    - All sessions revoked on successful password reset
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
import uuid
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from config import (
    FORGOT_RATE_LIMIT_COUNT,
    FORGOT_RATE_LIMIT_WINDOW,
    OTP_EXPIRY_MINUTES,
    OTP_LENGTH,
    OTP_MAX_ATTEMPTS,
    OTP_MAX_SESSIONS_PER_HOUR,
    OTP_PEPPER,
    OTP_RESEND_COOLDOWN_S,
    OTP_RESEND_LIMIT,
    PASSWORD_RESET_JWT_SECRET,
    RESET_TOKEN_EXPIRY_MIN,
)
from database import AuditLog, PasswordResetJTI, PasswordResetOTP, PasswordResetSession, User, UserPasswordHistory
from modules.auth.password_service import PasswordService
from modules.auth.session_service import SessionService

logger = logging.getLogger("yowon.auth.password_reset")

# In-memory rate limit buckets (IP-level) — same pattern as security.py
_reset_rate_buckets: dict[str, deque[float]] = defaultdict(deque)

import time


# ── Helpers ───────────────────────────────────────────────────────────────────

def _hash_otp(otp: str) -> str:
    """
    HMAC-SHA256 of the OTP using a server-side pepper.
    Resists offline brute-force even if the DB is exfiltrated.
    Falls back to plain SHA-256 if OTP_PEPPER is not configured.
    """
    pepper = OTP_PEPPER
    if pepper:
        return hmac.new(
            pepper.encode("utf-8"),
            otp.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
    return hashlib.sha256(otp.encode("utf-8")).hexdigest()


def _verify_otp_hash(plain_otp: str, stored_hash: str) -> bool:
    """Constant-time comparison to prevent timing oracle attacks."""
    computed = _hash_otp(plain_otp)
    return hmac.compare_digest(computed.encode("utf-8"), stored_hash.encode("utf-8"))


def _generate_otp() -> str:
    """Generate a cryptographically secure zero-padded OTP."""
    return str(secrets.randbelow(10 ** OTP_LENGTH)).zfill(OTP_LENGTH)


def _parse_user_agent(ua: str | None) -> dict:
    """Parse raw User-Agent string into human-readable browser/OS/device."""
    if not ua:
        return {"browser": "Unknown Browser", "os": "Unknown OS", "device": "Desktop"}
    u = ua.lower()
    browser = (
        "Chrome" if "chrome" in u and "edg" not in u and "opr" not in u
        else "Firefox" if "firefox" in u
        else "Safari" if "safari" in u and "chrome" not in u
        else "Edge" if "edg" in u
        else "Opera" if "opr" in u or "opera" in u
        else "Unknown Browser"
    )
    os_name = (
        "Windows 11" if "windows nt 10.0" in u
        else "macOS" if "mac os x" in u
        else "iOS" if "iphone" in u or "ipad" in u
        else "Android" if "android" in u
        else "Linux" if "linux" in u
        else "Unknown OS"
    )
    device = (
        "Mobile" if any(x in u for x in ("mobile", "iphone", "android"))
        else "Tablet" if any(x in u for x in ("ipad", "tablet"))
        else "Desktop"
    )
    return {"browser": browser, "os": os_name, "device": device}


def _check_ip_rate_limit(ip: str) -> None:
    """Enforce per-IP rate limit on forgot-password requests."""
    now = time.monotonic()
    bucket = _reset_rate_buckets[ip]
    while bucket and now - bucket[0] > FORGOT_RATE_LIMIT_WINDOW:
        bucket.popleft()
    if len(bucket) >= FORGOT_RATE_LIMIT_COUNT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password reset requests. Please try again later.",
        )
    bucket.append(now)


def _write_audit_log(
    db: Session,
    event_type: str,
    actor_id: Optional[str],
    ip: Optional[str],
    user_agent: Optional[str],
    extra: Optional[str] = None,
) -> None:
    """Write a structured audit log entry."""
    ua_info = _parse_user_agent(user_agent)
    log = AuditLog(
        uuid=str(uuid.uuid4()),
        actor_id=actor_id,
        event_type=event_type,
        target_entity="password_reset",
        new_values=extra,
        correlation_id=str(uuid.uuid4()),
        ip_address=ip,
        user_agent=f"{ua_info['browser']} on {ua_info['os']} ({ua_info['device']})",
        timestamp=datetime.utcnow(),
    )
    db.add(log)


# ── Main Service ──────────────────────────────────────────────────────────────

class PasswordResetService:
    """Orchestrates the full OTP password reset flow."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self._session_service = SessionService(db)

    # ── Step 1: Request OTP ───────────────────────────────────────────────────

    def request_otp(
        self,
        email: str,
        ip: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> tuple[str, str]:
        """
        Generate and store a new OTP for the given email.

        Returns:
            (session_id, plain_otp) — caller must send the plain OTP by email
            and must NOT store the plain OTP.

        Always returns successfully even if the email is unknown
        (prevents email enumeration).
        """
        _check_ip_rate_limit(ip or "unknown")

        email = email.strip().lower()
        user = self.db.query(User).filter(User.email == email).first()

        if not user:
            # Return a fake session_id and fake OTP — caller still sends them
            # to BackgroundTask which will silently no-op on send.
            # This prevents timing-based enumeration.
            logger.info(f"[PasswordReset] Forgot password for unknown email: {email}")
            fake_id = str(uuid.uuid4())
            fake_otp = _generate_otp()
            return fake_id, fake_otp

        # Abuse guard: max sessions per hour per user
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        recent_sessions = (
            self.db.query(PasswordResetSession)
            .filter(
                PasswordResetSession.user_id == user.uuid,
                PasswordResetSession.created_at >= one_hour_ago,
            )
            .count()
        )
        if recent_sessions >= OTP_MAX_SESSIONS_PER_HOUR:
            # Return generic response — don't expose rate limit to attacker
            logger.warning(f"[PasswordReset] Session abuse detected for user {user.uuid}")
            fake_id = str(uuid.uuid4())
            fake_otp = _generate_otp()
            return fake_id, fake_otp

        # Invalidate all existing PENDING sessions for this user
        self.db.query(PasswordResetSession).filter(
            PasswordResetSession.user_id == user.uuid,
            PasswordResetSession.status == "PENDING",
        ).update({"status": "INVALIDATED"}, synchronize_session=False)

        # Create new session
        expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
        session = PasswordResetSession(
            id=str(uuid.uuid4()),
            user_id=user.uuid,
            email=email,
            status="PENDING",
            email_status="EMAIL_PENDING",
            created_at=datetime.utcnow(),
            expires_at=expires_at,
        )
        self.db.add(session)
        self.db.flush()  # Get session.id without committing

        # Generate + hash OTP
        plain_otp = _generate_otp()
        otp_record = PasswordResetOTP(
            session_id=session.id,
            otp_hash=_hash_otp(plain_otp),
            attempts=0,
            resend_count=0,
            is_used=False,
            is_expired=False,
            created_at=datetime.utcnow(),
        )
        self.db.add(otp_record)

        _write_audit_log(
            self.db,
            event_type="PASSWORD_RESET_REQUESTED",
            actor_id=user.uuid,
            ip=ip,
            user_agent=user_agent,
        )

        self.db.commit()
        logger.info(f"[PasswordReset] OTP session {session.id} created for user {user.uuid}")
        return session.id, plain_otp

    # ── Step 2: Verify OTP ────────────────────────────────────────────────────

    def verify_otp(
        self,
        email: str,
        plain_otp: str,
        ip: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> str:
        """
        Verify the submitted OTP. Returns a short-lived reset JWT on success.

        Raises HTTPException on:
            - No active session found
            - Session expired
            - OTP mismatch
            - Attempt limit exceeded
        """
        email = email.strip().lower()
        now = datetime.utcnow()

        session = (
            self.db.query(PasswordResetSession)
            .filter(
                PasswordResetSession.email == email,
                PasswordResetSession.status == "PENDING",
                PasswordResetSession.expires_at > now,
            )
            .order_by(PasswordResetSession.created_at.desc())
            .first()
        )

        if not session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code.",
            )

        otp_record = (
            self.db.query(PasswordResetOTP)
            .filter(
                PasswordResetOTP.session_id == session.id,
                PasswordResetOTP.is_used == False,  # noqa: E712
                PasswordResetOTP.is_expired == False,  # noqa: E712
            )
            .order_by(PasswordResetOTP.created_at.desc())
            .first()
        )

        if not otp_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new one.",
            )

        # Check attempt limit BEFORE comparing
        if otp_record.attempts >= OTP_MAX_ATTEMPTS:
            session.status = "EXPIRED"
            _write_audit_log(
                self.db,
                event_type="PASSWORD_RESET_FAILED",
                actor_id=session.user_id,
                ip=ip,
                user_agent=user_agent,
                extra="Max attempts exceeded",
            )
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Too many failed attempts. Please restart the password reset process.",
            )

        # Increment attempt count
        otp_record.attempts += 1
        self.db.flush()

        if not _verify_otp_hash(plain_otp, otp_record.otp_hash):
            remaining = OTP_MAX_ATTEMPTS - otp_record.attempts
            self.db.commit()
            detail = (
                f"Invalid verification code. {remaining} attempt{'s' if remaining != 1 else ''} remaining."
                if remaining > 0
                else "Too many failed attempts. Please restart the password reset process."
            )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)

        # ✅ OTP verified — mark used immediately (prevent replay)
        otp_record.is_used = True
        session.status = "OTP_VERIFIED"

        # Generate reset JWT
        jti = str(uuid.uuid4())
        reset_token = jwt.encode(
            {
                "sub": session.id,
                "jti": jti,
                "type": "password_reset",
                "aud": "password-reset",
                "exp": now + timedelta(minutes=RESET_TOKEN_EXPIRY_MIN),
            },
            PASSWORD_RESET_JWT_SECRET,
            algorithm="HS256",
        )

        # Store JTI for replay protection
        jti_record = PasswordResetJTI(
            jti=jti,
            session_id=session.id,
            used_at=None,
            created_at=now,
        )
        self.db.add(jti_record)

        _write_audit_log(
            self.db,
            event_type="PASSWORD_RESET_OTP_VERIFIED",
            actor_id=session.user_id,
            ip=ip,
            user_agent=user_agent,
        )

        self.db.commit()
        logger.info(f"[PasswordReset] OTP verified for session {session.id}")
        return reset_token

    # ── Step 3: Reset Password ────────────────────────────────────────────────

    def reset_password(
        self,
        token: str,
        new_password: str,
        ip: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        """
        Validate reset JWT, apply new password, revoke all sessions.

        Raises HTTPException on:
            - Invalid/expired JWT
            - Already-used JTI (replay attack)
            - Session not in OTP_VERIFIED state
            - Password policy violation
            - New password == current password
        """
        try:
            payload = jwt.decode(
                token,
                PASSWORD_RESET_JWT_SECRET,
                algorithms=["HS256"],
                audience="password-reset",
            )
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The password reset link has expired. Please start over.",
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or malformed reset token.",
            )

        if payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token type.",
            )

        session_id = payload["sub"]
        jti = payload.get("jti")

        # Replay protection: check JTI
        if jti:
            jti_record = self.db.query(PasswordResetJTI).filter_by(jti=jti).first()
            if not jti_record:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired reset session.",
                )
            if jti_record.used_at is not None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This reset link has already been used.",
                )
            jti_record.used_at = datetime.utcnow()

        session = self.db.query(PasswordResetSession).filter_by(id=session_id).first()
        if not session or session.status != "OTP_VERIFIED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset session.",
            )

        user = self.db.query(User).filter_by(uuid=session.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account not found.",
            )

        # Password policy
        PasswordService.validate_password_strength(new_password)

        # Password history: check current password
        if PasswordService.verify_password(new_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from your current password.",
            )

        # Password history: check last 5 passwords
        history_records = (
            self.db.query(UserPasswordHistory)
            .filter_by(user_uuid=user.uuid)
            .order_by(UserPasswordHistory.created_at.desc())
            .limit(5)
            .all()
        )
        for record in history_records:
            if PasswordService.verify_password(new_password, record.password_hash):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You cannot reuse any of your last 5 passwords.",
                )

        # Archive current password hash in history
        old_history = UserPasswordHistory(
            user_uuid=user.uuid,
            password_hash=user.password_hash,
            created_at=datetime.utcnow()
        )
        self.db.add(old_history)

        # Enforce history limit (keep last 5)
        all_histories = (
            self.db.query(UserPasswordHistory)
            .filter_by(user_uuid=user.uuid)
            .order_by(UserPasswordHistory.created_at.desc())
            .all()
        )
        if len(all_histories) > 5:
            # Delete older history records
            for old_rec in all_histories[5:]:
                self.db.delete(old_rec)

        # Update User metadata
        user.last_password_change = datetime.utcnow()
        user.password_reset_count = (user.password_reset_count or 0) + 1
        user.password_reset_at = datetime.utcnow()

        # Apply new password
        user.password_hash = PasswordService.hash_password(new_password)
        user.updated_at = datetime.utcnow()
        session.status = "COMPLETED"

        # Revoke all active sessions across all devices
        try:
            self._session_service.revoke_all_user_sessions(user.uuid)
        except Exception as exc:
            logger.warning(f"[PasswordReset] Session revocation error for user {user.uuid}: {exc}")

        # Calculate duration of the reset flow
        duration_sec = int((datetime.utcnow() - session.created_at).total_seconds())
        ua_info = _parse_user_agent(user_agent)
        import json
        extra_meta = {
            "reset_duration_seconds": duration_sec,
            "browser": ua_info["browser"],
            "os": ua_info["os"],
            "device": ua_info["device"],
            "ip": ip or "unknown"
        }

        _write_audit_log(
            self.db,
            event_type="PASSWORD_RESET_COMPLETED",
            actor_id=user.uuid,
            ip=ip,
            user_agent=user_agent,
            extra=json.dumps(extra_meta),
        )

        self.db.commit()

        # Successful reset triggers immediate cleanup
        self._cleanup_expired()

        logger.info(f"[PasswordReset] Password reset completed for user {user.uuid}")

    # ── Step 4: Resend OTP ────────────────────────────────────────────────────

    def resend_otp(
        self,
        email: str,
        ip: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> tuple[str, str]:
        """
        Resend the OTP for an active session.
        Enforces: max OTP_RESEND_LIMIT resends and OTP_RESEND_COOLDOWN_S cooldown.

        Returns:
            (session_id, plain_otp) — caller sends via BackgroundTask.
        """
        email = email.strip().lower()
        now = datetime.utcnow()

        session = (
            self.db.query(PasswordResetSession)
            .filter(
                PasswordResetSession.email == email,
                PasswordResetSession.status == "PENDING",
                PasswordResetSession.expires_at > now,
            )
            .order_by(PasswordResetSession.created_at.desc())
            .first()
        )

        if not session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active password reset session found for this email.",
            )

        # Get the most recent OTP for this session
        latest_otp = (
            self.db.query(PasswordResetOTP)
            .filter_by(session_id=session.id)
            .order_by(PasswordResetOTP.created_at.desc())
            .first()
        )

        resend_count = latest_otp.resend_count if latest_otp else 0

        if resend_count >= OTP_RESEND_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Maximum resend limit reached. Please start the password reset process again.",
            )

        if latest_otp and latest_otp.last_resend_at:
            cooldown_end = latest_otp.last_resend_at + timedelta(seconds=OTP_RESEND_COOLDOWN_S)
            if now < cooldown_end:
                seconds_remaining = int((cooldown_end - now).total_seconds())
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Please wait {seconds_remaining} seconds before requesting another code.",
                )

        # Expire the previous OTP
        if latest_otp:
            latest_otp.is_expired = True

        # Create new OTP row under the same session
        plain_otp = _generate_otp()
        new_otp = PasswordResetOTP(
            session_id=session.id,
            otp_hash=_hash_otp(plain_otp),
            attempts=0,
            resend_count=resend_count + 1,
            last_resend_at=now,
            is_used=False,
            is_expired=False,
            created_at=now,
        )
        self.db.add(new_otp)

        _write_audit_log(
            self.db,
            event_type="PASSWORD_RESET_OTP_RESENT",
            actor_id=session.user_id,
            ip=ip,
            user_agent=user_agent,
        )

        self.db.commit()
        logger.info(f"[PasswordReset] OTP resent for session {session.id} (resend #{resend_count + 1})")
        return session.id, plain_otp

    # ── Maintenance ───────────────────────────────────────────────────────────

    def _cleanup_expired(self) -> None:
        """Delete OTP data older than 7 days to keep the table lean."""
        cutoff = datetime.utcnow() - timedelta(days=7)
        try:
            deleted_otps = (
                self.db.query(PasswordResetOTP)
                .filter(PasswordResetOTP.created_at < cutoff)
                .delete(synchronize_session=False)
            )
            deleted_jtis = (
                self.db.query(PasswordResetJTI)
                .filter(PasswordResetJTI.created_at < cutoff)
                .delete(synchronize_session=False)
            )
            deleted_sessions = (
                self.db.query(PasswordResetSession)
                .filter(PasswordResetSession.created_at < cutoff)
                .delete(synchronize_session=False)
            )
            self.db.commit()
            logger.info(
                f"[PasswordReset] Cleanup: removed {deleted_otps} OTPs, "
                f"{deleted_jtis} JTIs, {deleted_sessions} sessions older than 7 days."
            )
        except Exception as exc:
            logger.warning(f"[PasswordReset] Cleanup failed: {exc}")

    # ── Operational Metrics ───────────────────────────────────────────────────

    def get_security_metrics(self) -> dict:
        """Calculate password reset security and operational metrics for the last 24 hours."""
        from sqlalchemy import func
        import json
        now = datetime.utcnow()
        yesterday = now - timedelta(hours=24)

        # 1. Resets completed today
        resets_today = (
            self.db.query(PasswordResetSession)
            .filter(
                PasswordResetSession.status == "COMPLETED",
                PasswordResetSession.created_at >= yesterday,
            )
            .count()
        )

        # 2. Failed OTP attempts
        failed_attempts = (
            self.db.query(func.sum(PasswordResetOTP.attempts))
            .filter(PasswordResetOTP.created_at >= yesterday)
            .scalar() or 0
        )

        # 3. Resend frequency (total OTP resends in last 24h)
        total_resends = (
            self.db.query(func.sum(PasswordResetOTP.resend_count))
            .filter(PasswordResetOTP.created_at >= yesterday)
            .scalar() or 0
        )

        # 4. Average verification time (seconds from session creation to completion)
        completed_logs = (
            self.db.query(AuditLog)
            .filter(
                AuditLog.event_type == "PASSWORD_RESET_COMPLETED",
                AuditLog.timestamp >= yesterday,
            )
            .all()
        )

        total_duration = 0
        counted_logs = 0
        for log in completed_logs:
            if log.new_values:
                try:
                    meta = json.loads(log.new_values)
                    if "reset_duration_seconds" in meta:
                        total_duration += meta["reset_duration_seconds"]
                        counted_logs += 1
                except Exception:
                    pass

        avg_verification_time_sec = (
            float(total_duration) / counted_logs if counted_logs > 0 else 0.0
        )

        return {
            "password_resets_today": resets_today,
            "failed_otp_attempts_today": failed_attempts,
            "resend_frequency_today": total_resends,
            "avg_verification_time_seconds": avg_verification_time_sec,
        }

