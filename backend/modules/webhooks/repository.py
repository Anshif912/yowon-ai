from typing import List, Optional
from sqlalchemy.orm import Session
from database import EnterpriseWebhook, WebhookDelivery

class WebhookRepository:
    """Handles CRUD database operations for outbound webhooks subscriptions."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, webhook_uuid: str) -> Optional[EnterpriseWebhook]:
        return self.db.query(EnterpriseWebhook).filter(EnterpriseWebhook.uuid == webhook_uuid).first()

    def get_workspace_webhooks(self, workspace_id: str) -> List[EnterpriseWebhook]:
        return self.db.query(EnterpriseWebhook).filter(EnterpriseWebhook.workspace_id == workspace_id).all()

    def create_webhook(self, workspace_id: str, target_url: str, events_json: str) -> EnterpriseWebhook:
        import uuid
        webhook = EnterpriseWebhook(
            uuid=str(uuid.uuid4()),
            workspace_id=workspace_id,
            target_url=target_url,
            events_json=events_json,
            hmac_key="webhook-hmac-secret-key-12345",
            status="ACTIVE"
        )
        self.db.add(webhook)
        self.db.commit()
        return webhook

    def delete_webhook(self, webhook_uuid: str) -> bool:
        webhook = self.get_by_id(webhook_uuid)
        if webhook:
            self.db.delete(webhook)
            self.db.commit()
            return True
        return False
