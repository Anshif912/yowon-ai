from pydantic import BaseModel
from typing import Dict, Any, List

class SystemHealthResponse(BaseModel):
    status: str
    connectors_healthy: bool
    plugin_sandbox_healthy: bool
    secrets_vault_healthy: bool

class SystemMetricsResponse(BaseModel):
    connector_syncs_total: int
    plugins_installed: int
    webhooks_dispatched: int
    secrets_accessed_total: int
