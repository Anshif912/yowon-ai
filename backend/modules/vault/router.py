import uuid
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db, User
from auth.security import get_current_user
from core.security.secrets.vault import SecretsVaultService
from core.event_bus import publish as publish_event
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
    """Lists all active secrets inside the vault scoped to the requesting workspace."""
    vault_service = SecretsVaultService(db)
    ws_id = resolve_workspace_id(x_workspace_id)
    secrets = vault_service.list_secrets_for_workspace(ws_id)
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

    secret = vault_service.get_by_id(secret_id)
    if not secret:
        raise HTTPException(status_code=500, detail="Failed to store secret")

    publish_event("SECRET_STORED", {
        "secret_id": secret_id,
        "key_name": payload.name,
        "actor_id": current_user.uuid
    })
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
    publish_event("SECRET_ROTATED", {
        "secret_id": id,
        "new_version": new_version,
        "actor_id": current_user.uuid
    })
    return envelope_response({"version": new_version})


@router.delete("/secrets/{id}", response_model=Dict[str, Any])
def delete_secret(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Revokes and purges a secret from the vault."""
    vault_service = SecretsVaultService(db)
    try:
        vault_service.revoke(id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    publish_event("SECRET_REVOKED", {
        "secret_id": id,
        "actor_id": current_user.uuid
    })
    return envelope_response({"deleted": True})


@router.get("/secrets/{id}/logs", response_model=Dict[str, Any])
def get_secret_access_logs(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches paginated audit log entries of secret accesses."""
    vault_service = SecretsVaultService(db)
    logs = vault_service.get_access_logs(id)
    data = [SecretAccessLogResponse.model_validate(l).model_dump() for l in logs]
    return envelope_response(data)
