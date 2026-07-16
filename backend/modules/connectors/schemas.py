from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ConnectorCreate(BaseModel):
    name: str
    connector_type: str
    secret_value: str  # OAuth key, PAT or refresh token

class ConnectorResponse(BaseModel):
    uuid: str
    workspace_id: str
    name: str
    connector_type: str
    status: str
    capabilities_json: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SyncResponse(BaseModel):
    uuid: str
    connector_id: str
    sync_status: str
    records_synced: int
    error_message: Optional[str] = None
    started_at: datetime
    finished_at: datetime

    class Config:
        from_attributes = True

class ConnectorJobResponse(BaseModel):
    uuid: str
    connector_id: str
    job_status: str
    created_at: datetime
    finished_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ConnectorDiagnosticsResponse(BaseModel):
    connector_id: str
    latency_ms: int
    connectivity: str  # REACHABLE | UNREACHABLE
    permissions_valid: bool
    rate_limit_remaining: int
