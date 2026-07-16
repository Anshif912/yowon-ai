from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db, User
from auth.security import get_current_user
from modules.teams.service import TeamService
from modules.teams.schemas import (
    TeamCreate,
    TeamResponse,
    TeamInvitationCreate,
    TeamInvitationResponse,
    TeamMemberResponse,
    TeamDashboardResponse,
)

router = APIRouter(prefix="/teams", tags=["Teams"])

def get_workspace_id(
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> str:
    if x_workspace_id:
        return x_workspace_id
    
    # Fallback to the user's PERSONAL workspace
    from database import Workspace, WorkspaceMember
    personal_ws = db.query(Workspace).filter(
        Workspace.type == "PERSONAL",
        Workspace.workspace_id.in_(
            db.query(WorkspaceMember.workspace_id).filter(WorkspaceMember.user_id == current_user.uuid)
        )
    ).first()
    if personal_ws:
        return personal_ws.workspace_id
        
    any_ws = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == current_user.uuid).first()
    if any_ws:
        return any_ws.workspace_id
        
    raise HTTPException(status_code=400, detail="User does not belong to any workspace")

@router.get("", response_model=List[TeamResponse])
def list_teams(
    workspace_id: str = Depends(get_workspace_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all teams in the active workspace."""
    service = TeamService(db)
    return service.repo.list_by_workspace(workspace_id)

@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    payload: TeamCreate,
    workspace_id: str = Depends(get_workspace_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new team inside the active workspace."""
    service = TeamService(db)
    return service.create_team(workspace_id, payload, current_user.uuid)

@router.get("/{team_id}", response_model=TeamResponse)
def get_team(
    team_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gets details of a team."""
    service = TeamService(db)
    return service.get_team_by_id(team_id, current_user.uuid)

@router.get("/{team_id}/dashboard", response_model=TeamDashboardResponse)
def get_team_dashboard(
    team_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gets statistics and activity for a team."""
    service = TeamService(db)
    return service.get_dashboard(team_id, current_user.uuid)

@router.put("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: str,
    payload: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates team properties."""
    service = TeamService(db)
    return service.update_team(team_id, payload, current_user.uuid)

@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(
    team_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Archives/soft-deletes a team."""
    service = TeamService(db)
    service.delete_team(team_id, current_user.uuid)
    return None

@router.post("/{team_id}/invite", response_model=TeamInvitationResponse)
def invite_member(
    team_id: str,
    payload: TeamInvitationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates an invitation for a member to join a team."""
    service = TeamService(db)
    return service.invite_member(team_id, payload, current_user.uuid)

@router.post("/join", response_model=TeamMemberResponse)
def join_team(
    code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Joins a team using an invite code."""
    service = TeamService(db)
    return service.join_team(code, current_user.uuid)

@router.post("/{team_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_team(
    team_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leaves a team."""
    service = TeamService(db)
    service.leave_team(team_id, current_user.uuid)
    return None
