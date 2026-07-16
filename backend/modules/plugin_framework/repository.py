from typing import List, Optional
from sqlalchemy.orm import Session
from database import PlatformPlugin, PluginVersion, PluginPermission

class PluginRepository:
    """Handles CRUD database operations for platform extensions."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, plugin_uuid: str) -> Optional[PlatformPlugin]:
        return self.db.query(PlatformPlugin).filter(PlatformPlugin.uuid == plugin_uuid).first()

    def get_all_active_plugins(self) -> List[PlatformPlugin]:
        return self.db.query(PlatformPlugin).filter(PlatformPlugin.status == "ACTIVE").all()

    def create_plugin(self, name: str, version: str, publisher: str, permissions_json: str, is_verified: bool = False) -> PlatformPlugin:
        import uuid
        plugin = PlatformPlugin(
            uuid=str(uuid.uuid4()),
            name=name,
            version=version,
            publisher=publisher,
            permissions_json=permissions_json,
            is_verified=is_verified,
            sandboxed=True,
            status="ACTIVE"
        )
        self.db.add(plugin)
        self.db.commit()
        return plugin

    def delete_plugin(self, plugin_uuid: str) -> bool:
        plugin = self.get_by_id(plugin_uuid)
        if plugin:
            self.db.delete(plugin)
            self.db.commit()
            return True
        return False
