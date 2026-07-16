from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from database import get_db, User
from modules.organizations.service import OrganizationService
from modules.organizations.schemas import OrganizationCreate, OrganizationResponse
from auth.security import get_current_user

router = APIRouter(prefix="/organizations", tags=["Organizations"])

@router.get("", response_model=List[OrganizationResponse])
def list_organizations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Lists all organizations where the user is an owner or active member."""
    service = OrganizationService(db)
    return service.list_user_organizations(current_user.uuid)

@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new organization. Supports optional Idempotency-Key validation header."""
    idempotency_key = request.headers.get("Idempotency-Key")
    service = OrganizationService(db)
    
    # Check if slug already exists to prevent duplicate creations
    if idempotency_key:
        existing = service.repo.get_by_slug(payload.slug)
        if existing:
            return existing

    return service.create_organization(payload, current_user.uuid)

@router.get("/{org_uuid}", response_model=OrganizationResponse)
def get_organization(
    org_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns profile details of the specified organization."""
    service = OrganizationService(db)
    return service.get_organization_by_uuid(org_uuid, current_user.uuid)

@router.put("/{org_uuid}", response_model=OrganizationResponse)
def update_organization(
    org_uuid: str,
    payload: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates organization attributes."""
    service = OrganizationService(db)
    return service.update_organization(org_uuid, payload, current_user.uuid)

@router.delete("/{org_uuid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization(
    org_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Executes organization soft-delete."""
    service = OrganizationService(db)
    service.delete_organization(org_uuid, current_user.uuid)
    return None

@router.post("/{org_uuid}/restore", response_model=OrganizationResponse)
def restore_organization(
    org_uuid: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Restores soft-deleted organization details."""
    service = OrganizationService(db)
    return service.restore_organization(org_uuid, current_user.uuid)
