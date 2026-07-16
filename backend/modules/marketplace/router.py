import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db, User
from auth.security import get_current_user

from .schemas import MarketplaceItemCreate, MarketplaceItemResponse
from .service import MarketplaceService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])

def envelope_response(data: Any) -> Dict[str, Any]:
    return {
        "apiVersion": "v1",
        "success": True,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "correlation_id": "marketplace-correlation-id",
        "data": data,
        "meta": {}
    }


# ── REST Routes ───────────────────────────────────────────────────────────────

@router.get("", response_model=Dict[str, Any])
def get_marketplace_items_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists verified publisher plugins, templates and report packages."""
    service = MarketplaceService(db)
    items = service.list_marketplace_items()
    data = [MarketplaceItemResponse.model_validate(i).model_dump() for i in items]
    return envelope_response(data)


@router.post("", response_model=Dict[str, Any])
def publish_marketplace_item_endpoint(
    payload: MarketplaceItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Publishes a new tool package inside marketplace indexes."""
    service = MarketplaceService(db)
    item = service.publish_new_item(payload.name, payload.item_type, payload.publisher)
    data = MarketplaceItemResponse.model_validate(item).model_dump()
    return envelope_response(data)
