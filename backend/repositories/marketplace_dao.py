"""
repositories/marketplace_dao.py — Marketplace & Extensions Data Access Object (DAO)

Encapsulates all database persistence operations for Marketplace Plugins,
extension installations, configuration parameters, and permissions.
"""

import uuid
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from database import Base
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Text

logger = logging.getLogger("yowon.marketplace.dao")


class InstalledPlugin(Base):
    """Represents an installed marketplace extension."""
    __tablename__ = "installed_plugins"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: str = Column(String(36), nullable=False, index=True)
    plugin_id: str = Column(String(100), nullable=False, index=True)
    is_active: bool = Column(Boolean, default=True, nullable=False)
    installed_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)


class MarketplaceDAO:
    """Encapsulates SQL / ORM operations for Marketplace Extensions."""

    def __init__(self, db: Session):
        self.db = db

    def get_installation(self, workspace_id: str, plugin_id: str) -> Optional[InstalledPlugin]:
        """Retrieves plugin installation record."""
        return self.db.query(InstalledPlugin).filter(
            InstalledPlugin.workspace_id == workspace_id,
            InstalledPlugin.plugin_id == plugin_id
        ).first()

    def list_installed(self, workspace_id: str = "default-ws") -> List[InstalledPlugin]:
        """Lists installed plugins for workspace context."""
        return self.db.query(InstalledPlugin).filter(
            InstalledPlugin.workspace_id == workspace_id,
            InstalledPlugin.is_active == True
        ).all()

    def install_plugin(self, plugin_id: str, workspace_id: str = "default-ws") -> InstalledPlugin:
        """Installs or activates an extension plugin."""
        existing = self.get_installation(workspace_id, plugin_id)
        if existing:
            existing.is_active = True
            self.db.commit()
            self.db.refresh(existing)
            return existing

        inst = InstalledPlugin(
            uuid=str(uuid.uuid4()),
            workspace_id=workspace_id,
            plugin_id=plugin_id,
            is_active=True,
            installed_at=datetime.utcnow()
        )
        self.db.add(inst)
        self.db.commit()
        self.db.refresh(inst)
        return inst
