from typing import List, Optional
from sqlalchemy.orm import Session
from database import MarketplaceItem

class MarketplaceRepository:
    """Handles CRUD database operations for marketplace listings."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, item_uuid: str) -> Optional[MarketplaceItem]:
        return self.db.query(MarketplaceItem).filter(MarketplaceItem.uuid == item_uuid).first()

    def get_all_items(self) -> List[MarketplaceItem]:
        return self.db.query(MarketplaceItem).all()

    def create_item(self, name: str, item_type: str, publisher: str, is_verified: bool = False) -> MarketplaceItem:
        import uuid
        item = MarketplaceItem(
            uuid=str(uuid.uuid4()),
            name=name,
            item_type=item_type,
            publisher=publisher,
            is_verified=is_verified,
            downloads=0,
            trust_score=5.0
        )
        self.db.add(item)
        self.db.commit()
        return item
