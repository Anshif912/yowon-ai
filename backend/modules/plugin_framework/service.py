import json
import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from database import PlatformPlugin, PluginVersion, PluginPermission, MarketplaceItem, MarketplaceInstall
from .repository import PluginRepository

class PluginService:
    """Manages plugin installations, manifest validations, and compatibility checks."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = PluginRepository(db)

    def install_from_marketplace(self, marketplace_item_id: str, workspace_id: str) -> PlatformPlugin:
        item = self.db.query(MarketplaceItem).filter(MarketplaceItem.uuid == marketplace_item_id).first()
        if not item:
            raise ValueError("Marketplace item not found")

        # Create plugin record
        permissions_list = ["PROJECT_READ", "WORKSPACE_READ"]
        plugin = self.repo.create_plugin(
            name=item.name,
            version="1.0.0",
            publisher=item.publisher,
            permissions_json=json.dumps(permissions_list),
            is_verified=item.is_verified
        )

        # Seed compatibility version
        plugin_ver = PluginVersion(
            uuid=str(uuid.uuid4()),
            plugin_id=plugin.uuid,
            version="1.0.0",
            min_backend_version="1.0.0"
        )
        self.db.add(plugin_ver)

        # Save permission registry details
        for perm in permissions_list:
            db_perm = PluginPermission(
                uuid=str(uuid.uuid4()),
                plugin_id=plugin.uuid,
                permission_name=perm,
                granted=True
            )
            self.db.add(db_perm)

        # Register Marketplace Install
        install = MarketplaceInstall(
            uuid=str(uuid.uuid4()),
            marketplace_item_id=marketplace_item_id,
            workspace_id=workspace_id,
            status="INSTALLED"
        )
        self.db.add(install)
        
        # Increment downloads
        item.downloads += 1

        self.db.commit()
        return plugin

    def disable_plugin(self, plugin_id: str) -> Optional[PlatformPlugin]:
        plugin = self.repo.get_by_id(plugin_id)
        if plugin:
            plugin.status = "DISABLED"
            self.db.commit()
        return plugin

    def uninstall_plugin(self, plugin_id: str) -> bool:
        plugin = self.repo.get_by_id(plugin_id)
        if plugin:
            # Delete permissions and versions
            self.db.query(PluginPermission).filter(PluginPermission.plugin_id == plugin_id).delete()
            self.db.query(PluginVersion).filter(PluginVersion.plugin_id == plugin_id).delete()
            self.repo.delete_plugin(plugin_id)
            self.db.commit()
            return True
        return False
