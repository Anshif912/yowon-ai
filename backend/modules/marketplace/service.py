from typing import List, Optional
from sqlalchemy.orm import Session
from database import MarketplaceItem, MarketplaceInstall, Workspace
from .repository import MarketplaceRepository

class MarketplaceService:
    """Manages marketplace publisher catalog and installation details."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = MarketplaceRepository(db)

    def publish_new_item(self, name: str, item_type: str, publisher: str) -> MarketplaceItem:
        # Verified publishers condition check
        is_verified = publisher.lower() in ["yowon", "sentinel", "forge"]
        return self.repo.create_item(name, item_type, publisher, is_verified)

    def list_marketplace_items(self) -> List[MarketplaceItem]:
        items = self.repo.get_all_items()
        if not items:
            # Seed default marketplace items
            item1 = self.publish_new_item("Slack Notification Hub", "plugin", "yowon")
            item2 = self.publish_new_item("Jira Ticket Synchronizer", "plugin", "forge")
            item3 = self.publish_new_item("CodeQL Security Scanner", "plugin", "yowon")
            item4 = self.publish_new_item("Trivy Container Inspector", "plugin", "yowon")
            item5 = self.publish_new_item("OpenAI GPT-4o Connector", "plugin", "forge")
            item6 = self.publish_new_item("LLM Response Hallucination Filter", "plugin", "yowon")
            items = [item1, item2, item3, item4, item5, item6]
        return items

    def resolve_workspace_id(self, user_uuid: str, workspace_id: Optional[str] = None) -> Optional[str]:
        if workspace_id:
            return workspace_id
        # Fallback to first user workspace
        from database import WorkspaceMember
        member = self.db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user_uuid).first()
        if member:
            return member.workspace_id
        return None

    def get_installations(self, workspace_id: str) -> List[MarketplaceInstall]:
        return self.db.query(MarketplaceInstall).filter(MarketplaceInstall.workspace_id == workspace_id).all()

    def install_item(self, item_uuid: str, workspace_id: str) -> Optional[MarketplaceInstall]:
        item = self.repo.get_by_id(item_uuid)
        if not item:
            return None

        # Check if already installed
        existing = self.db.query(MarketplaceInstall).filter(
            MarketplaceInstall.marketplace_item_id == item_uuid,
            MarketplaceInstall.workspace_id == workspace_id
        ).first()
        
        if existing:
            existing.status = "INSTALLED"
            self.db.commit()
            return existing

        import uuid
        install = MarketplaceInstall(
            uuid=str(uuid.uuid4()),
            marketplace_item_id=item_uuid,
            workspace_id=workspace_id,
            status="INSTALLED"
        )
        self.db.add(install)
        
        # Increment downloads
        item.downloads = (item.downloads or 0) + 1
        
        self.db.commit()
        return install

    def uninstall_item(self, item_uuid: str, workspace_id: str) -> bool:
        install = self.db.query(MarketplaceInstall).filter(
            MarketplaceInstall.marketplace_item_id == item_uuid,
            MarketplaceInstall.workspace_id == workspace_id
        ).first()
        if not install:
            return False
        
        self.db.delete(install)
        self.db.commit()
        return True

    def toggle_item_status(self, item_uuid: str, workspace_id: str) -> Optional[str]:
        install = self.db.query(MarketplaceInstall).filter(
            MarketplaceInstall.marketplace_item_id == item_uuid,
            MarketplaceInstall.workspace_id == workspace_id
        ).first()
        if not install:
            # Install it first
            res = self.install_item(item_uuid, workspace_id)
            return res.status if res else None
        
        # Toggle status
        install.status = "INACTIVE" if install.status == "INSTALLED" else "INSTALLED"
        self.db.commit()
        return install.status
