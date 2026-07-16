from typing import Optional, List
from sqlalchemy.orm import Session
from .providers.local_provider import LocalSecretsProvider
from database import SecretAccessLog, SecretsVault, EnterpriseConnector
import uuid


class SecretsVaultService:
    """Orchestrates system secrets vault calls, rotations, versions and audits."""

    def __init__(self, db: Session):
        self.db = db
        self.provider = LocalSecretsProvider(db)

    def store(self, connector_id: str, key_name: str, secret_value: str) -> str:
        """Stores token and returns unique vault uuid reference."""
        return self.provider.store_secret(connector_id, key_name, secret_value)

    def get(self, secret_id: str, actor_id: str, version: Optional[int] = None) -> str:
        """Retrieves raw decrypted value and writes auditable read logs."""
        val = self.provider.get_secret(secret_id, version)

        # Log read access
        access_log = SecretAccessLog(
            uuid=str(uuid.uuid4()),
            secret_id=secret_id,
            actor_id=actor_id
        )
        self.db.add(access_log)
        self.db.commit()

        return val

    def rotate(self, secret_id: str, new_value: str) -> int:
        """Rotates credentials and increments model versions."""
        return self.provider.rotate_secret(secret_id, new_value)

    def revoke(self, secret_id: str) -> None:
        """Revokes token references."""
        self.provider.revoke_secret(secret_id)

    def list_secrets_for_workspace(self, workspace_id: str) -> List[SecretsVault]:
        """Returns all secrets scoped to a workspace via connector join."""
        return (
            self.db.query(SecretsVault)
            .join(EnterpriseConnector, EnterpriseConnector.uuid == SecretsVault.connector_id, isouter=True)
            .filter(
                (EnterpriseConnector.workspace_id == workspace_id) | (SecretsVault.connector_id == None)
            )
            .all()
        )

    def get_by_id(self, secret_id: str) -> Optional[SecretsVault]:
        """Returns a single secret record by UUID."""
        return self.db.query(SecretsVault).filter(SecretsVault.uuid == secret_id).first()

    def get_access_logs(self, secret_id: str) -> List[SecretAccessLog]:
        """Fetches audit log entries of secret accesses ordered newest first."""
        return (
            self.db.query(SecretAccessLog)
            .filter(SecretAccessLog.secret_id == secret_id)
            .order_by(SecretAccessLog.accessed_at.desc())
            .all()
        )

