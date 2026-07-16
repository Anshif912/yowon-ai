from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SecretCreate(BaseModel):
    name: str
    connector_id: Optional[str] = None
    secret_value: str

class SecretRotate(BaseModel):
    new_value: str

class SecretResponse(BaseModel):
    uuid: str
    connector_id: Optional[str] = None
    secret_key_name: str
    current_version: int
    created_at: datetime

    class Config:
        from_attributes = True

class SecretAccessLogResponse(BaseModel):
    uuid: str
    secret_id: str
    actor_id: str
    accessed_at: datetime

    class Config:
        from_attributes = True
