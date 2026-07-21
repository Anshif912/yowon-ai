"""
repositories/connector_dao.py — Enterprise Connectors Data Access Object (DAO)

Encapsulates all database persistence operations for enterprise integration connectors,
OAuth tokens, API credentials, and sync logs.
"""

import uuid
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from database import EnterpriseConnector

logger = logging.getLogger("yowon.connectors.dao")


class ConnectorDAO:
    """Encapsulates SQL / ORM operations for EnterpriseConnector."""

    def __init__(self, db: Session):
        self.db = db

    def get_connector(self, connector_id: str) -> Optional[EnterpriseConnector]:
        """Retrieves an EnterpriseConnector by UUID or provider type."""
        return self.db.query(EnterpriseConnector).filter(
            (EnterpriseConnector.uuid == connector_id) |
            (EnterpriseConnector.connector_type == connector_id)
        ).first()

    def list_connectors(self, workspace_id: Optional[str] = None) -> List[EnterpriseConnector]:
        """Lists enterprise connectors for active workspace context."""
        query = self.db.query(EnterpriseConnector)
        if workspace_id:
            query = query.filter(EnterpriseConnector.workspace_id == workspace_id)
        return query.order_by(EnterpriseConnector.updated_at.desc()).all()

    def upsert_connector(
        self,
        name: str,
        connector_type: str,
        auth_type: str = "OAUTH2",
        status: str = "CONNECTED",
        workspace_id: str = "default-ws"
    ) -> EnterpriseConnector:
        """Upserts an EnterpriseConnector record."""
        existing = self.db.query(EnterpriseConnector).filter(
            EnterpriseConnector.workspace_id == workspace_id,
            EnterpriseConnector.connector_type == connector_type
        ).first()

        if existing:
            existing.status = status
            existing.last_sync_at = datetime.utcnow()
            existing.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing)
            return existing

        conn = EnterpriseConnector(
            uuid=str(uuid.uuid4()),
            workspace_id=workspace_id,
            name=name,
            connector_type=connector_type,
            auth_type=auth_type,
            status=status,
            last_sync_at=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        self.db.add(conn)
        self.db.commit()
        self.db.refresh(conn)
        return conn
