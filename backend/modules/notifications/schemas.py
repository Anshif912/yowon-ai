from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class NotificationResponse(BaseModel):
    uuid: str
    user_id: str
    project_id: Optional[str] = None
    workspace_id: Optional[str] = None
    title: str
    message: str
    category: str
    priority: str
    severity: str
    is_read: bool
    timestamp: datetime

    class Config:
        from_attributes = True
