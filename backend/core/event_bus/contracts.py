from datetime import datetime
from typing import Dict, Any
from pydantic import BaseModel, Field

class EventEnvelope(BaseModel):
    event_id: str
    event_type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    workspace_id: str
    project_id: str
    actor_id: str
    correlation_id: str
    payload: Dict[str, Any]
