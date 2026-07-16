from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class WebhookCreate(BaseModel):
    target_url: str
    events: List[str]  # e.g., ["PROJECT_CREATED", "DNA_GENERATED"]

class WebhookResponse(BaseModel):
    uuid: str
    workspace_id: str
    target_url: str
    events_json: str
    hmac_key: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class WebhookDeliveryResponse(BaseModel):
    uuid: str
    webhook_id: str
    event_name: str
    response_code: Optional[int] = None
    status: str
    payload_json: str
    retry_count: int
    attempted_at: datetime

    class Config:
        from_attributes = True
