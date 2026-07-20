import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header, Query
from sqlalchemy.orm import Session

from database import get_db, User
from auth.security import get_current_user

from .schemas import ConnectorCreate, ConnectorResponse, SyncResponse, ConnectorDiagnosticsResponse
from .service import ConnectorService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/connectors", tags=["Connectors"])

def resolve_workspace_id(x_workspace_id: Optional[str]) -> str:
    return x_workspace_id or "default-ws"

def envelope_response(data: Any) -> Dict[str, Any]:
    return {
        "apiVersion": "v1",
        "success": True,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "correlation_id": "connectors-correlation-id",
        "data": data,
        "meta": {}
    }


# ── REST Routes ───────────────────────────────────────────────────────────────

@router.get("", response_model=Dict[str, Any])
def get_connectors_endpoint(
    x_workspace_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists workspace-level connectors integrations, auto-seeding default connectors if none exist."""
    import json
    import uuid
    from database import EnterpriseConnector

    service = ConnectorService(db)
    ws_id = resolve_workspace_id(x_workspace_id)
    connectors = service.repo.get_workspace_connectors(ws_id)

    if not connectors:
        seed_data = [
            ("GitHub Enterprise Integration", "github", "ACTIVE"),
            ("GitLab Core Connector", "gitlab", "ACTIVE"),
            ("Bitbucket Server Tunnel", "bitbucket", "ACTIVE"),
            ("Azure DevOps Build Pipeline", "azure_devops", "ACTIVE"),
            ("Slack Security Dispatcher", "slack", "ACTIVE"),
            ("Jira Workflows Sync", "jira", "FAILED"),
            ("Discord Alerts Webhook", "discord", "ACTIVE"),
            ("OpenAI LLM Provider", "openai", "ACTIVE"),
            ("Gemini AI API", "gemini", "ACTIVE"),
            ("Ollama Local Tunnel", "ollama", "ACTIVE")
        ]
        
        for name, conn_type, status in seed_data:
            conn = EnterpriseConnector(
                uuid=str(uuid.uuid4()),
                workspace_id=ws_id,
                name=name,
                connector_type=conn_type,
                status=status,
                capabilities_json=json.dumps({"capabilities": ["sync", "diagnose", "rotate"]}),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(conn)
            db.flush()
            # Seed OAuth token inside vault
            service.vault.store(conn.uuid, "token", f"demo_{conn_type}_token_secret_key_123")
            
        db.commit()
        connectors = service.repo.get_workspace_connectors(ws_id)

    data = [ConnectorResponse.model_validate(c).model_dump() for c in connectors]
    return envelope_response(data)


@router.post("", response_model=Dict[str, Any])
def create_connector_endpoint(
    payload: ConnectorCreate,
    x_workspace_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Registers and authenticates a connector."""
    service = ConnectorService(db)
    conn = service.create_new_connector(
        resolve_workspace_id(x_workspace_id),
        payload.name,
        payload.connector_type,
        payload.secret_value
    )
    data = ConnectorResponse.model_validate(conn).model_dump()
    return envelope_response(data)


@router.post("/{id}/sync", response_model=Dict[str, Any])
def sync_connector_endpoint(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Triggers background incremental update sync tasks."""
    service = ConnectorService(db)
    try:
        sync_log = service.run_sync_job(id, current_user.uuid)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    data = SyncResponse.model_validate(sync_log).model_dump()
    return envelope_response(data)


@router.get("/{id}/diagnostics", response_model=Dict[str, Any])
def get_connector_diagnostics_endpoint(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Runs connectivity checks, rate limits, and latency diagnostics."""
    service = ConnectorService(db)
    try:
        diag = service.test_adapter_connectivity(id, current_user.uuid)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    data = ConnectorDiagnosticsResponse.model_validate(diag).model_dump()
    return envelope_response(data)


@router.post("/{id}/rotate-secret", response_model=Dict[str, Any])
def rotate_secret_endpoint(
    id: str,
    new_secret_value: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Rotates tokens stored inside platform secrets vault."""
    service = ConnectorService(db)
    success = service.rotate_connector_credentials(id, new_secret_value)
    if not success:
        raise HTTPException(status_code=404, detail="Connector secret rotation failed")
    return envelope_response({"rotated": True})


@router.delete("/{id}", response_model=Dict[str, Any])
def delete_connector_endpoint(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes and revokes a connector registration."""
    service = ConnectorService(db)
    success = service.delete_connector(id)
    if not success:
        raise HTTPException(status_code=404, detail="Connector not found")
    return envelope_response({"deleted": True})
