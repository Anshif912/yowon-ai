from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class MarketplaceItemCreate(BaseModel):
    name: str
    item_type: str
    publisher: str

class MarketplaceItemResponse(BaseModel):
    uuid: str
    name: str
    item_type: str
    publisher: str
    trust_score: float
    downloads: int
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True
