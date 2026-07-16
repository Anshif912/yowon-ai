from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db, User
from auth.security import get_current_user
from modules.ownership.service import OwnershipService
from modules.ownership.schemas import (
    OwnershipRecordResponse,
    ClaimRequestResponse,
    ClaimRequestCreate,
    TransferRequestCreate,
    TransferRequestResponse,
    ReviewSubmission,
    ReviewResponse,
    TimelineItemResponse,
)

# Router for ownership mappings and claims
router = APIRouter(prefix="/projects/{project_id}/ownership", tags=["Ownership"])

# Router for project activity feeds & timeline
timeline_router = APIRouter(prefix="/projects/{project_id}", tags=["Timeline"])


@router.get("", response_model=List[OwnershipRecordResponse])
def get_ownership_shares(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves active ownership allocation share records."""
    service = OwnershipService(db)
    # Validate access to project
    from modules.projects.service import ProjectService
    proj_service = ProjectService(db)
    proj_service.get_project_by_id(project_id, current_user.uuid)
    
    return service.repo.get_records_by_project(project_id)


@router.post("/request", response_model=ClaimRequestResponse)
def submit_claim_request(
    project_id: str,
    payload: ClaimRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submits a claim request for ownership (automatically triggers conflict reviews)."""
    service = OwnershipService(db)
    return service.request_ownership(project_id, payload, current_user.uuid)


@router.post("/verify", response_model=ReviewResponse)
def verify_claim(
    project_id: str,
    request_id: str,
    payload: ReviewSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Governance verification action for claim review queue (Admin/Manager restricted)."""
    service = OwnershipService(db)
    return service.verify_ownership(project_id, request_id, payload, current_user.uuid)


@router.post("/transfer", response_model=TransferRequestResponse)
def request_or_accept_transfer(
    project_id: str,
    payload: Optional[TransferRequestCreate] = None,
    code: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Handles secure ownership transfer (creates request or completes transfer via verification code)."""
    service = OwnershipService(db)
    if code:
        return service.accept_transfer(project_id, code, current_user.uuid)
    
    if payload:
        return service.create_transfer(project_id, payload, current_user.uuid)
    
    raise HTTPException(status_code=400, detail="EITHER_PAYLOAD_OR_CODE_REQUIRED")


@timeline_router.get("/timeline", response_model=List[TimelineItemResponse])
def get_timeline_feed(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves consolidated project workspace progress timeline logs."""
    service = OwnershipService(db)
    return service.get_timeline(project_id)
