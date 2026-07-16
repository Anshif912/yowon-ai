import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from database import get_db, User
from auth.security import get_current_user

from .schemas import PluginInstallRequest, PluginResponse
from .service import PluginService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/plugins", tags=["Plugins"])

def resolve_workspace_id(x_workspace_id: Optional[str]) -> str:
    return x_workspace_id or "default-ws"

def envelope_response(data: Any) -> Dict[str, Any]:
    return {
        "apiVersion": "v1",
        "success": True,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "correlation_id": "plugins-correlation-id",
        "data": data,
        "meta": {}
    }


# ── REST Routes ───────────────────────────────────────────────────────────────

@router.get("", response_model=Dict[str, Any])
def get_installed_plugins_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all installed plugins configurations."""
    service = PluginService(db)
    plugins = service.repo.get_all_active_plugins()
    data = [PluginResponse.model_validate(p).model_dump() for p in plugins]
    return envelope_response(data)


@router.post("/install", response_model=Dict[str, Any])
def install_plugin_endpoint(
    payload: PluginInstallRequest,
    x_workspace_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Installs plugin extension package from marketplace."""
    service = PluginService(db)
    try:
        plugin = service.install_from_marketplace(payload.marketplace_item_id, resolve_workspace_id(x_workspace_id))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    data = PluginResponse.model_validate(plugin).model_dump()
    return envelope_response(data)


@router.post("/uninstall", response_model=Dict[str, Any])
def uninstall_plugin_endpoint(
    plugin_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Uninstalls and removes plugin from workspace."""
    service = PluginService(db)
    success = service.uninstall_plugin(plugin_id)
    if not success:
        raise HTTPException(status_code=404, detail="Plugin not found")
    return envelope_response({"uninstalled": True})
