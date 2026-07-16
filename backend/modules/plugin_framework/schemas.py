from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class PluginInstallRequest(BaseModel):
    marketplace_item_id: str

class PluginResponse(BaseModel):
    uuid: str
    name: str
    version: str
    description: Optional[str] = None
    publisher: str
    is_verified: bool
    permissions_json: str
    sandboxed: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class PluginVersionResponse(BaseModel):
    uuid: str
    plugin_id: str
    version: str
    min_backend_version: str
    created_at: datetime

    class Config:
        from_attributes = True
