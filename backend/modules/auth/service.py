import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from database import User, Organization, Workspace, WorkspaceMember, OrganizationMember, Session as UserSessionModel
from modules.auth.repository import AuthRepository
from modules.auth.password_service import PasswordService
from modules.auth.token_service import TokenService
from modules.auth.session_service import SessionService
from modules.auth.provider_registry import provider_registry
from modules.auth.schemas import SetupOrganization, UserLogin, UserRegister

logger = logging.getLogger("yowon.auth.service")

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = AuthRepository(db)
        self.session_service = SessionService(db)

    def bootstrap(self) -> Dict[str, Any]:
        """Exposes platform initialization data."""
        admin_exists = self.repo.count_administrators() > 0
        org_count = self.db.query(Organization).count()
        configured_providers = provider_registry.get_configured_providers()
        
        # Default password provider is always active
        providers = ["password"] + configured_providers
        
        return {
            "platform_initialized": admin_exists,
            "administrator_exists": admin_exists,
            "organizations": org_count,
            "providers": providers,
            "registration_allowed": not admin_exists,
            "providers_metadata": provider_registry.get_providers_metadata()
        }

    def setup_organization(self, payload: SetupOrganization, ip_address: Optional[str], user_agent: Optional[str]) -> Dict[str, Any]:
        """Executes first startup setup wizard (Installation Lock enforced)."""
        if self.repo.count_administrators() > 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Installation Already Completed."
            )

        # Validate password strength
        PasswordService.validate_password_strength(payload.password)

        # Check if user already exists
        existing = self.repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )

        # 1. Create User
        user = User(
            uuid=str(uuid.uuid4()),
            full_name=payload.admin_name,
            email=payload.email.lower(),
            password_hash=PasswordService.hash_password(payload.password),
            role="admin",
            status="active",
            email_verified=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.db.add(user)
        self.db.flush()

        # 2. Create Organization
        org = Organization(
            uuid=str(uuid.uuid4()),
            name=payload.organization_name,
            slug=payload.organization_name.lower().replace(" ", "-"),
            owner_id=user.uuid,
            created_at=datetime.utcnow()
        )
        self.db.add(org)
        self.db.flush()

        # 3. Create Org membership
        org_member = OrganizationMember(
            id=str(uuid.uuid4()),
            organization_id=org.uuid,
            user_id=user.uuid,
            role="owner",
            joined_at=datetime.utcnow()
        )
        self.db.add(org_member)

        # 4. Create default Workspace
        workspace = Workspace(
            workspace_id=str(uuid.uuid4()),
            organization_id=org.uuid,
            name="Default Workspace",
            description="Default workspace configured during platform installation.",
            type="COMPANY",
            visibility="PRIVATE",
            owner_id=user.uuid,
            created_at=datetime.utcnow()
        )
        self.db.add(workspace)
        self.db.flush()

        # 5. Create Workspace membership
        ws_member = WorkspaceMember(
            workspace_id=workspace.workspace_id,
            user_id=user.uuid,
            role="WORKSPACE_ADMIN",
            status="ACCEPTED",
            joined_at=datetime.utcnow()
        )
        self.db.add(ws_member)
        self.db.commit()

        # 6. Generate active login session
        jti = str(uuid.uuid4())
        browser, os_name = self._parse_user_agent(user_agent)
        self.session_service.create_user_session(
            user_uuid=user.uuid,
            token_jti=jti,
            device_name=f"{browser} on {os_name}",
            browser=browser,
            os_name=os_name,
            ip_address=ip_address
        )

        access_token = TokenService.create_access_token(user.uuid, user.role)
        refresh_token = TokenService.create_refresh_token(user.uuid, jti)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user
        }

    def authenticate_user(self, payload: UserLogin, ip_address: Optional[str], user_agent: Optional[str]) -> Dict[str, Any]:
        """Validates credentials, checks status locks, and spins up a UserSession."""
        user = self.repo.get_by_email(payload.email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

        if user.status == "LOCKED" or user.account_locked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is temporarily locked. Please contact support."
            )

        if user.status.upper() != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been deactivated."
            )

        if not PasswordService.verify_password(payload.password, user.password_hash):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.account_locked = True
                user.status = "LOCKED"
                logger.error(f"Account locked for user email={user.email} due to consecutive failed attempts.")
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

        # Reset failed attempts
        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()
        self.db.commit()

        jti = str(uuid.uuid4())
        browser, os_name = self._parse_user_agent(user_agent)
        self.session_service.create_user_session(
            user_uuid=user.uuid,
            token_jti=jti,
            device_name=f"{browser} on {os_name}",
            browser=browser,
            os_name=os_name,
            ip_address=ip_address
        )

        access_token = TokenService.create_access_token(user.uuid, user.role)
        refresh_token = TokenService.create_refresh_token(user.uuid, jti)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user
        }

    def rotate_session_token(self, refresh_token: str, ip_address: Optional[str]) -> Dict[str, Any]:
        """Validates rotated refresh tokens via active session entries."""
        payload = TokenService.decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type."
            )

        jti = payload.get("jti")
        session = self.session_service.get_session_by_jti(jti)
        if not session or session.is_revoked:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session is invalid or expired."
            )

        user = self.repo.get_by_uuid(payload.get("sub"))
        if not user or user.status.upper() != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User session is de-authorized."
            )

        # Invalidate old session and generate rotated session
        session.is_revoked = True
        self.db.commit()

        new_jti = str(uuid.uuid4())
        self.session_service.create_user_session(
            user_uuid=user.uuid,
            token_jti=new_jti,
            device_name=session.device_name,
            browser=session.browser,
            os_name=session.os,
            ip_address=ip_address
        )

        access_token = TokenService.create_access_token(user.uuid, user.role)
        new_refresh_token = TokenService.create_refresh_token(user.uuid, new_jti)

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "user": user
        }

    def terminate_session(self, refresh_token: str) -> None:
        """Revokes a specific session JTI token mapping."""
        try:
            payload = TokenService.decode_token(refresh_token)
            jti = payload.get("jti")
            if jti:
                self.session_service.revoke_session_by_jti(jti)
        except Exception:
            pass  # Fail silently to guarantee cleanup

    def terminate_all_sessions(self, user_uuid: str) -> None:
        """Revokes all active sessions for a user."""
        self.session_service.revoke_all_user_sessions(user_uuid)

    def register_user(self, payload: UserRegister, ip_address: Optional[str], user_agent: Optional[str]) -> Dict[str, Any]:
        """Registers a new user (Anyone can create an account)."""
        # Validate password strength
        PasswordService.validate_password_strength(payload.password)

        # Check if user already exists
        existing = self.repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )

        # 1. Create User
        user = User(
            uuid=str(uuid.uuid4()),
            full_name=payload.full_name,
            email=payload.email.lower(),
            password_hash=PasswordService.hash_password(payload.password),
            role="TEAM_MEMBER",
            status="active",
            email_verified=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.db.add(user)
        self.db.flush()

        # 2. Create personal organization and workspace
        org_name = f"{payload.full_name}'s Org"
        org = Organization(
            uuid=str(uuid.uuid4()),
            name=org_name,
            slug=(org_name.lower().replace(" ", "-") + "-" + str(uuid.uuid4())[:8])[:255],
            owner_id=user.uuid,
            created_at=datetime.utcnow()
        )
        self.db.add(org)
        self.db.flush()

        org_member = OrganizationMember(
            id=str(uuid.uuid4()),
            organization_id=org.uuid,
            user_id=user.uuid,
            role="owner",
            joined_at=datetime.utcnow()
        )
        self.db.add(org_member)

        workspace = Workspace(
            workspace_id=str(uuid.uuid4()),
            organization_id=org.uuid,
            name="Personal Workspace",
            description="Your personal engineering workspace.",
            type="PERSONAL",
            visibility="PRIVATE",
            owner_id=user.uuid,
            created_at=datetime.utcnow()
        )
        self.db.add(workspace)
        self.db.flush()

        ws_member = WorkspaceMember(
            workspace_id=workspace.workspace_id,
            user_id=user.uuid,
            role="WORKSPACE_ADMIN",
            status="ACCEPTED",
            joined_at=datetime.utcnow()
        )
        self.db.add(ws_member)
        self.db.commit()

        # 3. Generate active login session
        jti = str(uuid.uuid4())
        browser, os_name = self._parse_user_agent(user_agent)
        self.session_service.create_user_session(
            user_uuid=user.uuid,
            token_jti=jti,
            device_name=f"{browser} on {os_name}",
            browser=browser,
            os_name=os_name,
            ip_address=ip_address
        )

        access_token = TokenService.create_access_token(user.uuid, user.role)
        refresh_token = TokenService.create_refresh_token(user.uuid, jti)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": user
        }

    def _parse_user_agent(self, user_agent: Optional[str]) -> tuple[str, str]:
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
        return browser, os_name
