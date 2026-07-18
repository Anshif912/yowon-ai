import os
import base64
import logging
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from database import SecretsVault, SecretVersion, SecretAccessLog

logger = logging.getLogger("yowon.auth.secrets_vault")

# Retrieve encryption key from environment or fallback to auto-generated key for local dev
VAULT_KEY_RAW = os.getenv("VAULT_ENCRYPTION_KEY", os.getenv("JWT_SECRET_KEY", "yowon-ai-super-secret-key-2026-auth-prod-ready"))

# Derive a 32-byte key for AES-256 GCM
def _derive_key(secret_str: str) -> bytes:
    # Ensure key is exactly 32 bytes (256 bits) using SHA-256 of the secret_str
    import hashlib
    return hashlib.sha256(secret_str.encode("utf-8")).digest()

_ENCRYPTION_KEY = _derive_key(VAULT_KEY_RAW)

class SecretsVaultService:
    @staticmethod
    def encrypt_token(plain_text: str) -> str:
        """Encrypts a plain text token using AESGCM."""
        aesgcm = AESGCM(_ENCRYPTION_KEY)
        nonce = os.urandom(12)  # GCM standard 12-byte nonce
        encrypted_bytes = aesgcm.encrypt(nonce, plain_text.encode("utf-8"), None)
        # Store combined nonce + ciphertext encoded in base64
        combined = nonce + encrypted_bytes
        return base64.b64encode(combined).decode("utf-8")

    @staticmethod
    def decrypt_token(encrypted_b64: str) -> str:
        """Decrypts a base64 encoded GCM string."""
        combined = base64.b64decode(encrypted_b64.encode("utf-8"))
        # Split nonce (first 12 bytes) and ciphertext
        nonce = combined[:12]
        ciphertext = combined[12:]
        aesgcm = AESGCM(_ENCRYPTION_KEY)
        decrypted_bytes = aesgcm.decrypt(nonce, ciphertext, None)
        return decrypted_bytes.decode("utf-8")

    @classmethod
    def store_oauth_token(
        cls,
        db: Session,
        connector_id: str,
        token: str,
        secret_key_name: str = "oauth_token",
        expires_in_seconds: Optional[int] = None
    ) -> SecretsVault:
        """Encrypts and stores a token under the specified connector, logging the version history."""
        encrypted = cls.encrypt_token(token)
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in_seconds) if expires_in_seconds else None
        
        # Check if secret already exists for this connector and key name
        secret = db.query(SecretsVault).filter(
            (SecretsVault.connector_id == connector_id) & 
            (SecretsVault.secret_key_name == secret_key_name)
        ).first()

        if secret:
            secret.encrypted_secret = encrypted
            secret.current_version += 1
            secret.expires_at = expires_at
            secret.updated_at = datetime.utcnow()
            logger.info(f"[SecretsVaultService] Updated secret for connector_id={connector_id}, key_name={secret_key_name}, version={secret.current_version}")
        else:
            secret = SecretsVault(
                connector_id=connector_id,
                encrypted_secret=encrypted,
                secret_key_name=secret_key_name,
                current_version=1,
                expires_at=expires_at,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(secret)
            db.flush()
            logger.info(f"[SecretsVaultService] Created new secret for connector_id={connector_id}, key_name={secret_key_name}")

        # Record version history
        version_entry = SecretVersion(
            secret_id=secret.uuid,
            encrypted_secret=encrypted,
            version=secret.current_version,
            created_at=datetime.utcnow()
        )
        db.add(version_entry)
        db.commit()
        return secret

    @classmethod
    def get_oauth_token(
        cls,
        db: Session,
        connector_id: str,
        actor_id: Optional[str] = None,
        secret_key_name: str = "oauth_token"
    ) -> Optional[str]:
        """Retrieves and decrypts the token, recording the access in the audit log."""
        secret = db.query(SecretsVault).filter(
            (SecretsVault.connector_id == connector_id) & 
            (SecretsVault.secret_key_name == secret_key_name)
        ).first()

        if not secret:
            logger.warning(f"[SecretsVaultService] Secret not found for connector_id={connector_id}, key_name={secret_key_name}")
            return None

        # Check expiration
        if secret.expires_at and secret.expires_at < datetime.utcnow():
            logger.warning(f"[SecretsVaultService] Secret expired for connector_id={connector_id}, key_name={secret_key_name}")
            return None

        # Record access audit log if actor is provided
        if actor_id:
            access_log = SecretAccessLog(
                secret_id=secret.uuid,
                actor_id=actor_id,
                accessed_at=datetime.utcnow()
            )
            db.add(access_log)
            db.commit()

        try:
            decrypted = cls.decrypt_token(secret.encrypted_secret)
            return decrypted
        except Exception as e:
            logger.error(f"[SecretsVaultService] Failed to decrypt secret for connector_id={connector_id}: {e}")
            return None
