import uuid
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db, User, SecretsVault, SecretAccessLog
from auth.security import get_current_user
from core.security.secrets.vault import SecretsVaultService
from .schemas import SecretCreate, SecretRotate, SecretResponse, SecretAccessLogResponse

router = APIRouter(prefix="/vault", tags=["Vault"])

def resolve_workspace_id(x_workspace_id: Optional[str]) -> str:
    return x_workspace_id or "default-ws"

def envelope_response(data: Any) -> Dict[str, Any]:
    return {
        "apiVersion": "v1",
        "success": True,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "correlation_id": "vault-correlation-id",
        "data": data,
        "meta": {}
    }

@router.get("/secrets", response_model=Dict[str, Any])
def list_secrets(
    x_workspace_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all active secrets inside the vault."""
    # To filter by workspace, we can join with EnterpriseConnector
    from database import EnterpriseConnector
    ws_id = resolve_workspace_id(x_workspace_id)
    secrets = db.query(SecretsVault).join(
        EnterpriseConnector,
        EnterpriseConnector.uuid == SecretsVault.connector_id,
        isouter=True
    ).filter(
        (EnterpriseConnector.workspace_id == ws_id) | (SecretsVault.connector_id == None)
    ).all()
    
    data = [SecretResponse.model_validate(s).model_dump() for s in secrets]
    return envelope_response(data)

@router.post("/secrets", response_model=Dict[str, Any])
def create_secret(
    payload: SecretCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually registers a new secret key value inside the vault."""
    vault_service = SecretsVaultService(db)
    connector_id = payload.connector_id or str(uuid.uuid4())
    secret_id = vault_service.store(connector_id, payload.name, payload.secret_value)
    
    secret = db.query(SecretsVault).filter(SecretsVault.uuid == secret_id).first()
    if not secret:
        raise HTTPException(status_code=500, detail="Failed to store secret")
        
    data = SecretResponse.model_validate(secret).model_dump()
    return envelope_response(data)

@router.get("/secrets/{id}", response_model=Dict[str, Any])
def get_secret_value(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves raw decrypted value and writes auditable read logs."""
    vault_service = SecretsVaultService(db)
    try:
        val = vault_service.get(id, current_user.uuid)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return envelope_response({"value": val})

@router.post("/secrets/{id}/rotate", response_model=Dict[str, Any])
def rotate_secret(
    id: str,
    payload: SecretRotate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Rotates credentials and increments model versions."""
    vault_service = SecretsVaultService(db)
    try:
        new_version = vault_service.rotate(id, payload.new_value)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return envelope_response({"version": new_version})

@router.delete("/secrets/{id}", response_model=Dict[str, Any])
def delete_secret(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Revokes token references."""
    vault_service = SecretsVaultService(db)
    try:
        vault_service.revoke(id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return envelope_response({"deleted": True})

@router.get("/secrets/{id}/logs", response_model=Dict[str, Any])
def get_secret_access_logs(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches audit log entries of secret accesses."""
    logs = db.query(SecretAccessLog).filter(SecretAccessLog.secret_id == id).order_by(SecretAccessLog.accessed_at.desc()).all()
    data = [SecretAccessLogResponse.model_validate(l).model_dump() for l in logs]
    return envelope_response(data)
