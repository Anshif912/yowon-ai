from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from database import get_db, User
from modules.workspaces.service import WorkspaceService
from modules.workspaces.schemas import (
    WorkspaceCreate,
    WorkspaceResponse,
    WorkspaceInvitationCreate,
    WorkspaceInvitationResponse,
    WorkspaceMemberResponse,
)
from auth.security import get_current_user

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

@router.get("", response_model=List[WorkspaceResponse])
def list_workspaces(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Lists all active workspaces for the current user."""
    service = WorkspaceService(db)
    return service.list_user_workspaces(current_user.uuid)

@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
def create_workspace(
    payload: WorkspaceCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a workspace. Supports optional Idempotency-Key validation header."""
    idempotency_key = request.headers.get("Idempotency-Key")
    service = WorkspaceService(db)
    
    if idempotency_key:
        # Avoid creating duplicates by checking if the user already owns a workspace with the exact same name
        existing = db.query(service.repo.model).filter(
            service.repo.model.name == payload.name,
            service.repo.model.owner_id == current_user.uuid,
            service.repo.model.deleted_at.is_(None)
        ).first()
        if existing:
            return existing

    return service.create_workspace(payload, current_user.uuid)

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verifies membership and returns details using the Workspace Resolver Service."""
    service = WorkspaceService(db)
    return service.resolve_workspace(workspace_id, current_user.uuid)

@router.put("/{workspace_id}", response_model=WorkspaceResponse)
def update_workspace(
    workspace_id: str,
    payload: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates workspace details."""
    service = WorkspaceService(db)
    return service.update_workspace(workspace_id, payload, current_user.uuid)

@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Executes workspace soft-delete if it is not a Personal Workspace."""
    service = WorkspaceService(db)
    service.delete_workspace(workspace_id, current_user.uuid)
    return None

@router.post("/{workspace_id}/invite", response_model=WorkspaceInvitationResponse)
def create_invitation(
    workspace_id: str,
    payload: WorkspaceInvitationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Dispatches a workspace invitation (email, username, or code)."""
    service = WorkspaceService(db)
    return service.create_invitation(workspace_id, payload, current_user.uuid)

@router.get("/{workspace_id}/invitations", response_model=List[WorkspaceInvitationResponse])
def list_invitations(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists workspace invitations."""
    service = WorkspaceService(db)
    return service.list_invitations(workspace_id, current_user.uuid)

@router.post("/join", response_model=WorkspaceMemberResponse)
def join_workspace(
    code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accepts a workspace invitation and joins the workspace."""
    service = WorkspaceService(db)
    return service.accept_invitation(code, current_user.uuid)

@router.post("/reject")
def reject_workspace(
    code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Rejects a workspace invitation."""
    service = WorkspaceService(db)
    service.reject_invitation(code, current_user.uuid)
    return {"success": True, "detail": "Invitation rejected"}

@router.post("/{workspace_id}/leave")
def leave_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leaves the membership list of a workspace."""
    service = WorkspaceService(db)
    member = service.repo.get_member(workspace_id, current_user.uuid)
    if not member:
         raise HTTPException(status_code=404, detail="Workspace membership not found")
    
    db.delete(member)
    db.commit()
    return {"success": True, "detail": "Left workspace successfully"}
