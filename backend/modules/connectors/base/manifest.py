from typing import Optional
from pydantic import BaseModel

class ConnectorManifest(BaseModel):
    name: str
    version: str
    provider: str
    supports_webhooks: bool = False
    supports_incremental_sync: bool = True
    supports_oauth: bool = False
    supports_pat: bool = True
    supports_branches: bool = False
    supports_prs: bool = False
    supports_commits: bool = False
    supports_releases: bool = False
    supports_security: bool = False
    supports_ai_metadata: bool = False
