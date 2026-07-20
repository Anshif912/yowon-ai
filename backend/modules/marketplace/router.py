import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from database import get_db, User
from auth.security import get_current_user

from .schemas import MarketplaceItemCreate, MarketplaceItemResponse
from .service import MarketplaceService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])

def envelope_response(data: Any) -> Dict[str, Any]:
    return {
        "apiVersion": "v1",
        "success": True,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "correlation_id": "marketplace-correlation-id",
        "data": data,
        "meta": {}
    }


# ── REST Routes ───────────────────────────────────────────────────────────────

@router.get("", response_model=Dict[str, Any])
def get_marketplace_items_endpoint(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all verified publisher plugins, templates and report packages with install status."""
    service = MarketplaceService(db)
    items = service.list_marketplace_items()
    
    workspace_id = request.headers.get("X-Workspace-ID")
    resolved_ws = service.resolve_workspace_id(current_user.uuid, workspace_id)
    
    installed_ids = {}
    if resolved_ws:
        installs = service.get_installations(resolved_ws)
        for inst in installs:
            installed_ids[inst.marketplace_item_id] = inst.status

    data = []
    for i in items:
        dump = MarketplaceItemResponse.model_validate(i).model_dump()
        item_status = installed_ids.get(i.uuid, "not_installed")
        dump["is_installed"] = i.uuid in installed_ids
        dump["status"] = "installed" if item_status == "INSTALLED" else "inactive" if item_status == "INACTIVE" else "not_installed"
        data.append(dump)
        
    return envelope_response(data)


@router.post("", response_model=Dict[str, Any])
def publish_marketplace_item_endpoint(
    payload: MarketplaceItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Publishes a new tool package inside marketplace indexes."""
    service = MarketplaceService(db)
    item = service.publish_new_item(payload.name, payload.item_type, payload.publisher)
    data = MarketplaceItemResponse.model_validate(item).model_dump()
    return envelope_response(data)


@router.post("/{item_uuid}/install", response_model=Dict[str, Any])
def install_marketplace_item_endpoint(
    item_uuid: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Installs an extension into the active workspace."""
    service = MarketplaceService(db)
    workspace_id = request.headers.get("X-Workspace-ID")
    resolved_ws = service.resolve_workspace_id(current_user.uuid, workspace_id)
    if not resolved_ws:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active workspace context is required for installations."
        )
    
    install = service.install_item(item_uuid, resolved_ws)
    if not install:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marketplace item not found."
        )
    return envelope_response({
        "uuid": install.uuid,
        "status": install.status,
        "marketplace_item_id": install.marketplace_item_id,
        "workspace_id": install.workspace_id
    })


@router.post("/{item_uuid}/uninstall", response_model=Dict[str, Any])
def uninstall_marketplace_item_endpoint(
    item_uuid: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Uninstalls an extension from the active workspace."""
    service = MarketplaceService(db)
    workspace_id = request.headers.get("X-Workspace-ID")
    resolved_ws = service.resolve_workspace_id(current_user.uuid, workspace_id)
    if not resolved_ws:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active workspace context is required for uninstallation."
        )
    
    success = service.uninstall_item(item_uuid, resolved_ws)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active installation not found."
        )
    return envelope_response({"success": True})


@router.post("/{item_uuid}/toggle", response_model=Dict[str, Any])
def toggle_marketplace_item_endpoint(
    item_uuid: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggles status of an extension (enable/disable)."""
    service = MarketplaceService(db)
    workspace_id = request.headers.get("X-Workspace-ID")
    resolved_ws = service.resolve_workspace_id(current_user.uuid, workspace_id)
    if not resolved_ws:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active workspace context is required."
        )
    
    new_status = service.toggle_item_status(item_uuid, resolved_ws)
    if not new_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marketplace item not found."
        )
    return envelope_response({"status": new_status})
