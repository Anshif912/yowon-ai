import os
import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from database import User, Session as UserSession, Workspace, WorkspaceMember, AuditLog
from modules.identity.repository import IdentityRepository
from modules.identity.schemas import UserRegister, UserLogin
from modules.identity.validators import validate_password_strength, validate_email_format
from auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)

logger = logging.getLogger("yowon.identity.service")

class IdentityService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = IdentityRepository(db)

    def register_user(self, payload: UserRegister) -> User:
        # Validate input formatting
        validate_email_format(payload.email)
        validate_password_strength(payload.password)

        # Check if user already exists
        existing = self.repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists"
            )

        # Create user
        user = User(
            full_name=payload.full_name,
            email=payload.email.lower(),
            password_hash=hash_password(payload.password),
            role="user",
            status="active",  # Automatically verify for seamless onboarding
            email_verified=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.repo.create(user)

        # DETERMINISTIC BOOTSTRAPPING FLOW:
        # Create Personal Workspace automatically
        personal_ws = Workspace(
            workspace_id=str(uuid.uuid4()),
            name=f"{payload.full_name}'s Workspace",
            description="Your personal default workspace.",
            type="PERSONAL",
            visibility="PRIVATE",
            owner_id=user.uuid,
            preferences='{"evaluation_profile": "standard", "allowed_sources": ["*"], "leaderboard_visibility": "public"}',
            created_at=datetime.utcnow()
        )
        self.db.add(personal_ws)
        self.db.commit()

        # Add user as Workspace Owner/Admin in workspace_members
        ws_member = WorkspaceMember(
            workspace_id=personal_ws.workspace_id,
            user_id=user.uuid,
            role="WORKSPACE_ADMIN",
            status="ACCEPTED",
            joined_at=datetime.utcnow()
        )
        self.db.add(ws_member)
        
        # Create Immutable Audit Log
        audit = AuditLog(
            actor_id=user.uuid,
            event_type="CREATE_WORKSPACE",
            target_entity=personal_ws.workspace_id,
            previous_values=None,
            new_values=f'{{"name": "{personal_ws.name}", "type": "PERSONAL"}}',
            correlation_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)

        # Audit registration
        audit_reg = AuditLog(
            actor_id=user.uuid,
            event_type="REGISTER_USER",
            target_entity=user.uuid,
            previous_values=None,
            new_values=f'{{"email": "{user.email}"}}',
            correlation_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )
        self.db.add(audit_reg)
        self.db.commit()

        logger.info(f"User and Personal Workspace bootstrapped successfully: {user.email}")
        return user

    def authenticate_user(
        self, payload: UserLogin, ip_address: Optional[str], user_agent: Optional[str]
    ) -> Dict[str, Any]:
        email_clean = payload.email.lower()
        user = self.repo.get_by_email(email_clean)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Check account lock status
        if user.status == "LOCKED" or user.account_locked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is temporarily locked. Please contact support."
            )

        if user.status.upper() != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is not active."
            )

        # Verify password
        if not verify_password(payload.password, user.password_hash):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.account_locked = True
                user.status = "LOCKED"
                logger.error(f"Account locked: {email_clean} due to login failures.")
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        # Success: reset metrics and update login timestamp
        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()
        self.db.commit()

        # Parse user agent for OS and browser details
        browser, os_name = "Unknown Browser", "Unknown OS"
        if user_agent:
            if "Chrome" in user_agent:
                browser = "Chrome"
            elif "Firefox" in user_agent:
                browser = "Firefox"
            elif "Safari" in user_agent:
                browser = "Safari"
            
            if "Windows" in user_agent:
                os_name = "Windows"
            elif "Macintosh" in user_agent or "Mac OS" in user_agent:
                os_name = "macOS"
            elif "Linux" in user_agent:
                os_name = "Linux"

        # Generate JTI and token session
        jti = str(uuid.uuid4())
        user_session = UserSession(
            user_id=user.uuid,
            device_name=f"{browser} on {os_name}",
            browser=browser,
            os=os_name,
            ip_address=ip_address,
            token_jti=jti,
            last_active=datetime.utcnow(),
            is_revoked=False
        )
        self.repo.create_session(user_session)

        # Generate tokens
        access_token = create_access_token(user.uuid, user.role)
        # Create refresh token with jti claim
        expire = datetime.utcnow() + timedelta(days=7)
        refresh_payload = {
            "exp": expire,
            "sub": str(user.uuid),
            "jti": jti,
            "type": "refresh"
        }
        import jwt
        from auth.security import SECRET_KEY, ALGORITHM
        refresh_token = jwt.encode(refresh_payload, SECRET_KEY, algorithm=ALGORITHM)

        # Log login audit event
        audit = AuditLog(
            actor_id=user.uuid,
            event_type="LOGIN",
            target_entity=user.uuid,
            correlation_id=str(uuid.uuid4()),
            ip_address=ip_address,
            user_agent=user_agent,
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)
        self.db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user
        }

    def rotate_session_token(self, refresh_token: str, ip_address: Optional[str]) -> Dict[str, Any]:
        try:
            payload = decode_token(refresh_token)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session refresh failed: invalid signature"
            )

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        jti = payload.get("jti")
        session = self.repo.get_session_by_jti(jti)
        if not session or session.is_revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session is invalid or revoked"
            )

        user = self.repo.get_by_uuid(payload.get("sub"))
        if not user or user.status.upper() != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User session is locked or inactive"
            )

        # Rotate tokens and jti
        new_jti = str(uuid.uuid4())
        session.is_revoked = True  # Invalidate previous token
        
        new_session = UserSession(
            user_id=user.uuid,
            device_name=session.device_name,
            browser=session.browser,
            os=session.os,
            ip_address=ip_address,
            token_jti=new_jti,
            last_active=datetime.utcnow(),
            is_revoked=False
        )
        self.repo.create_session(new_session)

        # Generate rotated tokens
        access_token = create_access_token(user.uuid, user.role)
        
        expire = datetime.utcnow() + timedelta(days=7)
        refresh_payload = {
            "exp": expire,
            "sub": str(user.uuid),
            "jti": new_jti,
            "type": "refresh"
        }
        import jwt
        from auth.security import SECRET_KEY, ALGORITHM
        new_refresh_token = jwt.encode(refresh_payload, SECRET_KEY, algorithm=ALGORITHM)

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "user": user
        }

    def terminate_session(self, refresh_token: str) -> None:
        try:
            payload = decode_token(refresh_token)
            jti = payload.get("jti")
            session = self.repo.get_session_by_jti(jti)
            if session:
                session.is_revoked = True
                self.db.commit()
                # Audit log
                audit = AuditLog(
                    actor_id=session.user_id,
                    event_type="LOGOUT",
                    target_entity=session.uuid,
                    correlation_id=str(uuid.uuid4()),
                    timestamp=datetime.utcnow()
                )
                self.db.add(audit)
                self.db.commit()
        except Exception:
            pass

    def terminate_all_sessions(self, user_uuid: str) -> None:
        sessions = self.db.query(UserSession).filter(
            UserSession.user_id == user_uuid,
            UserSession.is_revoked == False
        ).all()
        for session in sessions:
            session.is_revoked = True
        
        # Audit log revocation
        audit = AuditLog(
            actor_id=user_uuid,
            event_type="SESSION_REVOKE",
            target_entity=user_uuid,
            correlation_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)
        self.db.commit()
