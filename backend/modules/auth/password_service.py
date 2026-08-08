import re
import bcrypt
from fastapi import HTTPException, status

try:
    from argon2 import PasswordHasher
    from argon2.exceptions import VerifyMismatchError
    _ph = PasswordHasher(
        time_cost=3,
        memory_cost=65536,
        parallelism=4,
        hash_len=32,
        salt_len=16
    )
    ARGON2_AVAILABLE = True
except ImportError:
    ARGON2_AVAILABLE = False

class PasswordService:
    @staticmethod
    def hash_password(password: str) -> str:
        """Hashes a plain password using Argon2id (or bcrypt as fallback)."""
        if ARGON2_AVAILABLE:
            try:
                return _ph.hash(password)
            except Exception:
                pass
        
        # Fallback to bcrypt
        pwd_bytes = password.encode('utf-8')[:72]
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(pwd_bytes, salt)
        return "$bcrypt$" + hashed.decode('utf-8')

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verifies a plain password against Argon2id or bcrypt hashes."""
        if not hashed_password:
            return False
            
        if hashed_password.startswith("$bcrypt$"):
            try:
                real_hash = hashed_password[8:]
                pwd_bytes = plain_password.encode('utf-8')[:72]
                hashed_bytes = real_hash.encode('utf-8')
                return bcrypt.checkpw(pwd_bytes, hashed_bytes)
            except Exception:
                return False
        
        if ARGON2_AVAILABLE:
            try:
                return _ph.verify(hashed_password, plain_password)
            except VerifyMismatchError:
                return False
            except Exception:
                pass
                
        # If Argon2 is not available but hash doesn't start with $bcrypt$, try bcrypt verify anyway as last resort
        try:
            pwd_bytes = plain_password.encode('utf-8')[:72]
            hashed_bytes = hashed_password.encode('utf-8')
            return bcrypt.checkpw(pwd_bytes, hashed_bytes)
        except Exception:
            return False

    @staticmethod
    def validate_password_strength(password: str) -> None:
        """Enforces enterprise password complexity policies (Minimum 8 chars)."""
        if len(password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long for security compliance."
            )
        if not re.search(r"[A-Z]", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one uppercase letter."
            )
        if not re.search(r"[a-z]", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one lowercase letter."
            )
        if not re.search(r"[0-9]", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one digit."
            )
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must contain at least one special character."
            )
