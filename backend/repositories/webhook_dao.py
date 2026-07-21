"""
repositories/webhook_dao.py — Webhooks & Delivery Logs Data Access Object (DAO)

Encapsulates all database persistence operations for Webhook Subscriptions,
delivery audit trails, response codes, and replay state.
"""

import uuid
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from database import WebhookSubscription, WebhookDeliveryLog

logger = logging.getLogger("yowon.webhooks.dao")


class WebhookDAO:
    """Encapsulates SQL / ORM operations for Webhook Subscriptions and Delivery Logs."""

    def __init__(self, db: Session):
        self.db = db

    def get_subscription(self, sub_id: str) -> Optional[WebhookSubscription]:
        """Retrieves a WebhookSubscription by UUID."""
        return self.db.query(WebhookSubscription).filter(WebhookSubscription.uuid == sub_id).first()

    def list_subscriptions(self, workspace_id: Optional[str] = None) -> List[WebhookSubscription]:
        """Lists active webhook subscriptions."""
        query = self.db.query(WebhookSubscription)
        if workspace_id:
            query = query.filter(WebhookSubscription.workspace_id == workspace_id)
        return query.order_by(WebhookSubscription.created_at.desc()).all()

    def create_subscription(
        self,
        target_url: str,
        secret: str,
        events: str = "EVALUATION_COMPLETED,VULNERABILITY_FOUND",
        workspace_id: str = "default-ws"
    ) -> WebhookSubscription:
        """Creates a new WebhookSubscription record."""
        sub = WebhookSubscription(
            uuid=str(uuid.uuid4()),
            workspace_id=workspace_id,
            target_url=target_url,
            secret=secret,
            events=events,
            is_active=True,
            created_at=datetime.utcnow()
        )
        self.db.add(sub)
        self.db.commit()
        self.db.refresh(sub)
        return sub

    def record_delivery(
        self,
        subscription_id: str,
        event_type: str,
        payload_json: str,
        response_code: int = 200,
        latency_ms: int = 42,
        status: str = "DELIVERED"
    ) -> WebhookDeliveryLog:
        """Records a WebhookDeliveryLog entry."""
        log = WebhookDeliveryLog(
            uuid=str(uuid.uuid4()),
            subscription_id=subscription_id,
            event_type=event_type,
            payload=payload_json,
            response_code=response_code,
            latency_ms=latency_ms,
            status=status,
            created_at=datetime.utcnow()
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log
