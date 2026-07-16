import os
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any
from fastapi import HTTPException, status

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "yowon-ai-super-secret-key-2026-auth-prod-ready")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

class TokenService:
    @staticmethod
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

    @staticmethod
    def create_refresh_token(subject: str, jti: str) -> str:
        """Generates a long-lived refresh JWT token with a session jti claim."""
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        payload = {
            "exp": expire,
            "sub": str(subject),
            "jti": jti,
            "type": "refresh"
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def decode_token(token: str) -> Dict[str, Any]:
        """Decodes a JWT token and raises HTTPException on expiry/invalid signatures."""
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
