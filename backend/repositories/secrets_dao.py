"""
repositories/secrets_dao.py — Secrets & Encryption Data Access Object (DAO)

Encapsulates all database persistence operations for encrypted enterprise secrets,
rotation histories, and access audit trails.
"""

import uuid
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from database import SecretsVault

logger = logging.getLogger("yowon.secrets.dao")


class SecretsDAO:
    """Encapsulates SQL / ORM operations for SecretsVault."""

    def __init__(self, db: Session):
        self.db = db

    def get_secret(self, secret_id: str) -> Optional[SecretsVault]:
        """Retrieves a SecretsVault entry by UUID or key_name."""
        return self.db.query(SecretsVault).filter(
            (SecretsVault.uuid == secret_id) | (SecretsVault.key_name == secret_id)
        ).first()

    def list_secrets(self, workspace_id: Optional[str] = None) -> List[SecretsVault]:
        """Lists encrypted secrets for active workspace context."""
        query = self.db.query(SecretsVault)
        if workspace_id:
            query = query.filter(SecretsVault.workspace_id == workspace_id)
        return query.order_by(SecretsVault.created_at.desc()).all()

    def store_secret(
        self,
        key_name: str,
        encrypted_val: str,
        secret_type: str = "API_KEY",
        scope: str = "WORKSPACE",
        workspace_id: str = "default-ws"
    ) -> SecretsVault:
        """Stores a new encrypted secret."""
        existing = self.db.query(SecretsVault).filter(
            SecretsVault.workspace_id == workspace_id,
            SecretsVault.key_name == key_name
        ).first()

        if existing:
            existing.encrypted_value = encrypted_val
            existing.version += 1
            existing.created_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing)
            return existing

        secret = SecretsVault(
            uuid=str(uuid.uuid4()),
            workspace_id=workspace_id,
            key_name=key_name,
            secret_type=secret_type,
            encrypted_value=encrypted_val,
            version=1,
            created_at=datetime.utcnow()
        )
        self.db.add(secret)
        self.db.commit()
        self.db.refresh(secret)
        return secret
