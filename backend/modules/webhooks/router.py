import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from database import get_db, User
from auth.security import get_current_user

from .schemas import WebhookCreate, WebhookResponse, WebhookDeliveryResponse
from .service import WebhookService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

def resolve_workspace_id(x_workspace_id: Optional[str]) -> str:
    return x_workspace_id or "default-ws"

def envelope_response(data: Any) -> Dict[str, Any]:
    return {
        "apiVersion": "v1",
        "success": True,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "correlation_id": "webhooks-correlation-id",
        "data": data,
        "meta": {}
    }


# ── REST Routes ───────────────────────────────────────────────────────────────

@router.get("", response_model=Dict[str, Any])
def get_webhooks_endpoint(
    x_workspace_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists registered outbound webhooks for workspace."""
    service = WebhookService(db)
    webhooks = service.repo.get_workspace_webhooks(resolve_workspace_id(x_workspace_id))
    data = [WebhookResponse.model_validate(w).model_dump() for w in webhooks]
    return envelope_response(data)


@router.post("", response_model=Dict[str, Any])
def register_webhook_endpoint(
    payload: WebhookCreate,
    x_workspace_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Registers outbound target webhook for Event Bus messages."""
    service = WebhookService(db)
    wh = service.register_new_webhook(
        resolve_workspace_id(x_workspace_id),
        payload.target_url,
        payload.events
    )
    data = WebhookResponse.model_validate(wh).model_dump()
    return envelope_response(data)


@router.post("/replays", response_model=Dict[str, Any])
def replay_delivery_endpoint(
    delivery_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Replays failed outbound webhook deliveries."""
    service = WebhookService(db)
    try:
        replay = service.replay_webhook_delivery(delivery_id, current_user.uuid)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return envelope_response({"replayed": True, "replay_uuid": replay.uuid})


@router.get("/deliveries", response_model=Dict[str, Any])
def get_webhook_deliveries(
    webhook_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches webhook deliveries logs."""
    from database import WebhookDelivery
    query = db.query(WebhookDelivery)
    if webhook_id:
        query = query.filter(WebhookDelivery.webhook_id == webhook_id)
    deliveries = query.order_by(WebhookDelivery.attempted_at.desc()).limit(50).all()
    data = [WebhookDeliveryResponse.model_validate(d).model_dump() for d in deliveries]
    return envelope_response(data)


@router.delete("/{id}", response_model=Dict[str, Any])
def delete_webhook_endpoint(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Removes a registered webhook endpoint."""
    from database import EnterpriseWebhook
    wh = db.query(EnterpriseWebhook).filter(EnterpriseWebhook.uuid == id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook not found")
    db.delete(wh)
    db.commit()
    return envelope_response({"deleted": True})
