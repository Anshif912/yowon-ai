import base64
import uuid
from typing import Optional
from sqlalchemy.orm import Session

from .base import BaseSecretsProvider
from database import SecretsVault, SecretVersion, SecretAccessLog

import hashlib
import os

# Encryption logic using a stable key derived from the JWT_SECRET_KEY env
try:
    from cryptography.fernet import Fernet
    _secret_key_str = os.getenv("JWT_SECRET_KEY", "yowon-ai-super-secret-key-2026-auth-prod-ready")
    _key_bytes = hashlib.sha256(_secret_key_str.encode()).digest()
    _fernet_key = base64.urlsafe_b64encode(_key_bytes)
    _fernet = Fernet(_fernet_key)
    def encrypt_val(val: str) -> str:
        return _fernet.encrypt(val.encode()).decode()
    def decrypt_val(enc_val: str) -> str:
        return _fernet.decrypt(enc_val.encode()).decode()
except ImportError:
    # Base64 fallback if cryptography is not available
    def encrypt_val(val: str) -> str:
        return base64.b64encode(val.encode()).decode()
    def decrypt_val(enc_val: str) -> str:
        return base64.b64decode(enc_val.encode()).decode()


class LocalSecretsProvider(BaseSecretsProvider):
    """Local SQLite database-based secret encryption vault."""

    def __init__(self, db: Session):
        self.db = db

    def store_secret(self, connector_id: str, key_name: str, secret_value: str) -> str:
        encrypted = encrypt_val(secret_value)
        vault = SecretsVault(
            uuid=str(uuid.uuid4()),
            connector_id=connector_id,
            encrypted_secret=encrypted,
            secret_key_name=key_name,
            current_version=1
        )
        self.db.add(vault)
        self.db.commit()

        # Seed first version
        version = SecretVersion(
            uuid=str(uuid.uuid4()),
            secret_id=vault.uuid,
            encrypted_secret=encrypted,
            version=1
        )
        self.db.add(version)
        self.db.commit()

        return vault.uuid

    def get_secret(self, secret_id: str, version: Optional[int] = None) -> str:
        vault = self.db.query(SecretsVault).filter(SecretsVault.uuid == secret_id).first()
        if not vault:
            raise ValueError("Secret not found")

        if version is not None:
            ver_obj = self.db.query(SecretVersion).filter(
                SecretVersion.secret_id == secret_id,
                SecretVersion.version == version
            ).first()
            if not ver_obj:
                raise ValueError(f"Secret version {version} not found")
            return decrypt_val(ver_obj.encrypted_secret)

        return decrypt_val(vault.encrypted_secret)

    def rotate_secret(self, secret_id: str, new_value: str) -> int:
        vault = self.db.query(SecretsVault).filter(SecretsVault.uuid == secret_id).first()
        if not vault:
            raise ValueError("Secret not found")

        next_ver = vault.current_version + 1
        encrypted = encrypt_val(new_value)

        vault.current_version = next_ver
        vault.encrypted_secret = encrypted

        version = SecretVersion(
            uuid=str(uuid.uuid4()),
            secret_id=vault.uuid,
            encrypted_secret=encrypted,
            version=next_ver
        )
        self.db.add(version)
        self.db.commit()
        return next_ver

    def revoke_secret(self, secret_id: str) -> None:
        vault = self.db.query(SecretsVault).filter(SecretsVault.uuid == secret_id).first()
        if vault:
            self.db.delete(vault)
            # Remove all versions
            self.db.query(SecretVersion).filter(SecretVersion.secret_id == secret_id).delete()
            self.db.commit()
