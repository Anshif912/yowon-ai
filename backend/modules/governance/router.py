import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from database import get_db, User
from auth.security import get_current_user

from modules.governance.schemas import GovernanceWorkflowResponse, ReviewSubmitRequest
from modules.decision_intelligence.schemas import DecisionPolicyResponse
from modules.governance.service import (
    get_project_governance_workflow,
    submit_governance_review,
    get_governance_decision_policies,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/governance", tags=["Governance"])

def resolve_workspace_id(x_workspace_id: Optional[str]) -> str:
    return x_workspace_id or "default-ws"


# ── Response envelope ─────────────────────────────────────────────────────────

def envelope_response(data: Any) -> Dict[str, Any]:
    return {
        "apiVersion": "v1",
        "success": True,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "correlation_id": "governance-correlation-id",
        "data": data,
        "meta": {}
    }


# ── Routers ───────────────────────────────────────────────────────────────────

@router.get("/projects/{id}", response_model=Dict[str, Any])
def get_project_governance_workflow_endpoint(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all governance review checkpoint steps for a project."""
    steps = get_project_governance_workflow(db, id)
    data = [GovernanceWorkflowResponse.model_validate(s).model_dump() for s in steps]
    return envelope_response(data)


@router.get("/policies", response_model=Dict[str, Any])
def get_governance_policies_endpoint(
    x_workspace_id: Optional[str] = Header(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists enforceable decision policies for workspace context."""
    policies = get_governance_decision_policies(db, resolve_workspace_id(x_workspace_id))
    data = [DecisionPolicyResponse.model_validate(p).model_dump() for p in policies]
    return envelope_response(data)


@router.post("/review", response_model=Dict[str, Any])
def submit_governance_review_endpoint(
    project_id: str,
    step_name: str,
    payload: ReviewSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submits review status and writes audit trace entry."""
    step = submit_governance_review(
        db,
        project_id,
        step_name,
        payload.status,
        payload.reviewer_comments,
        current_user.uuid
    )
    data = GovernanceWorkflowResponse.model_validate(step).model_dump()
    return envelope_response(data)
