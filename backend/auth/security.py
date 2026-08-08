import os
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import get_db, User

# Secret keys configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "yowon-ai-super-secret-key-2026-auth-prod-ready")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

# HTTP Bearer for extracting JWT authorization header
reusable_oauth2 = HTTPBearer(auto_error=False)


from modules.auth.password_service import PasswordService

def hash_password(password: str) -> str:
    """Hashes a plain password using PasswordService."""
    return PasswordService.hash_password(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against its hash using PasswordService."""
    return PasswordService.verify_password(plain_password, hashed_password)


def create_access_token(subject: str, role: str) -> str:
    """Generates a short-lived access JWT token."""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "type": "access"
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(subject: str) -> str:
    """Generates a long-lived refresh JWT token."""
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh"
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Decodes a JWT token and raises exception on expiration or invalid signature."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token signature has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    request: Request,
    token_credentials: Optional[HTTPAuthorizationCredentials] = Depends(reusable_oauth2),
    db: Session = Depends(get_db)
) -> User:
    """FastAPI dependency to extract current user from auth header or fall back to cookie."""
    token = None
    
    # 1. Try Authorization header
    if token_credentials:
        token = token_credentials.credentials
        
    # 2. Try cookie (fallback for browser context)
    if not token:
        token = request.cookies.get("access_token")
        
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_uuid = payload.get("sub")
    if not user_uuid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Subject not found in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.uuid == user_uuid).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if (user.status or "").lower() not in ("active", "pending_verification"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

        
    if user.account_locked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is locked due to multiple failed login attempts",
        )

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to check if user status is active."""
    return current_user


# Canonical System Roles
ROLE_SUPER_ADMIN = "SUPER_ADMIN"
ROLE_ORG_OWNER = "ORG_OWNER"
ROLE_WORKSPACE_ADMIN = "WORKSPACE_ADMIN"
ROLE_JUDGE = "JUDGE"
ROLE_REVIEWER = "REVIEWER"
ROLE_EVALUATOR = "EVALUATOR"
ROLE_PROJECT_OWNER = "PROJECT_OWNER"
ROLE_TEAM_LEADER = "TEAM_LEADER"
ROLE_TEAM_MEMBER = "TEAM_MEMBER"
ROLE_GUEST = "GUEST"

# Friendly Role Alias Mappings
ROLE_ALIASES: Dict[str, list[str]] = {
    "admin": [ROLE_SUPER_ADMIN, ROLE_ORG_OWNER, ROLE_WORKSPACE_ADMIN],
    "owner": [ROLE_SUPER_ADMIN, ROLE_ORG_OWNER],
    "platform owner": [ROLE_SUPER_ADMIN],
    "organization admin": [ROLE_ORG_OWNER, ROLE_WORKSPACE_ADMIN],
    "security engineer": [ROLE_SUPER_ADMIN, ROLE_ORG_OWNER, ROLE_WORKSPACE_ADMIN],
    "developer": [ROLE_PROJECT_OWNER, ROLE_TEAM_LEADER, ROLE_TEAM_MEMBER],
    "viewer": [ROLE_GUEST, ROLE_TEAM_MEMBER, ROLE_JUDGE, ROLE_REVIEWER, ROLE_EVALUATOR],
    "evaluator": [ROLE_JUDGE, ROLE_REVIEWER, ROLE_EVALUATOR],
    "member": [ROLE_TEAM_MEMBER, ROLE_PROJECT_OWNER, ROLE_TEAM_LEADER]
}


class RoleChecker:
    """FastAPI dependency to enforce role-based access control with alias support."""
    def __init__(self, allowed_roles: list[str]):
        # Expand allowed roles including aliases
        expanded = set()
        for role in allowed_roles:
            role_clean = role.strip()
            expanded.add(role_clean.upper())
            alias_matches = ROLE_ALIASES.get(role_clean.lower(), [])
            for alias_role in alias_matches:
                expanded.add(alias_role.upper())
        self.allowed_roles = list(expanded)

    def __call__(self, user: User = Depends(get_current_active_user)) -> User:
        user_role = (user.role or "").strip().upper()
        if user_role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{user.role}' is not authorized for this resource.",
            )
        return user

