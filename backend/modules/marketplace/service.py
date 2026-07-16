from typing import List
from sqlalchemy.orm import Session
from database import MarketplaceItem
from .repository import MarketplaceRepository

class MarketplaceService:
    """Manages marketplace publisher catalog verification details."""

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
            items = [item1, item2]
        return items
