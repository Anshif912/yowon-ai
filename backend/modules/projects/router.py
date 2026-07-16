from typing import List, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, status, Query
from sqlalchemy.orm import Session

from database import get_db, User, Project
from auth.security import get_current_user
from modules.projects.service import ProjectService
from modules.projects.schemas import (
    ProjectCreate,
    ProjectResponse,
    ProjectVersionCreate,
    ProjectVersionResponse,
    ProjectAttachmentCreate,
    ProjectAttachmentResponse,
    ProjectCommentCreate,
    ProjectCommentResponse,
    ProjectImportCreate,
    ProjectSearchItem,
)

router = APIRouter(prefix="/projects", tags=["Projects"])

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

@router.get("", response_model=dict)
def list_projects(
    page: int = 1,
    size: int = 10,
    limit: Optional[int] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    order: str = "desc",
    sort_order: Optional[str] = None,
    workspace_id: str = Depends(get_workspace_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all active projects within the resolved workspace with query parameters."""
    actual_limit = limit if limit is not None else size
    actual_order = sort_order if sort_order is not None else order
    
    query = db.query(Project).filter(
        Project.workspace_id == workspace_id,
        Project.deleted_at.is_(None)
    )
    if search:
        query = query.filter(Project.name.ilike(f"%{search}%") | Project.description.ilike(f"%{search}%"))
        
    sort_col = getattr(Project, sort_by, Project.created_at)
    if actual_order.lower() == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())
        
    total = query.count()
    items = query.offset((page - 1) * actual_limit).limit(actual_limit).all()
    
    return {
        "total": total,
        "page": page,
        "limit": actual_limit,
        "projects": [ProjectResponse.from_orm(p) for p in items]
    }

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    workspace_id: str = Depends(get_workspace_id),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Registers a project inside the active workspace."""
    service = ProjectService(db)
    return service.create_project(workspace_id, payload, current_user.uuid)

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gets details of a project."""
    service = ProjectService(db)
    return service.get_project_by_id(project_id, current_user.uuid)

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    payload: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates project properties."""
    service = ProjectService(db)
    return service.update_project(project_id, payload, current_user.uuid)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Archives/soft-deletes a project."""
    service = ProjectService(db)
    service.delete_project(project_id, current_user.uuid)
    return None

@router.post("/{project_id}/import", response_model=ProjectResponse)
def import_repository(
    project_id: str,
    payload: ProjectImportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Connects a repository import connection source."""
    service = ProjectService(db)
    return service.import_repository(project_id, payload, current_user.uuid)

@router.post("/{project_id}/version", response_model=ProjectVersionResponse)
def commit_version(
    project_id: str,
    payload: ProjectVersionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Registers a version release tag snapshot."""
    service = ProjectService(db)
    return service.commit_version(project_id, payload, current_user.uuid)

@router.get("/{project_id}/versions", response_model=List[ProjectVersionResponse])
def list_versions(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists version tags snapshots for the project workspace."""
    service = ProjectService(db)
    # Ensure user has workspace access to project first
    service.get_project_by_id(project_id, current_user.uuid)
    return service.repo.list_versions(project_id)

@router.get("/{project_id}/search", response_model=List[ProjectSearchItem])
def search_workspace(
    project_id: str,
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Runs a universal search indexing files, comments, versions, and evaluations."""
    service = ProjectService(db)
    return service.search_project_workspace(project_id, q, current_user.uuid)

@router.get("/{project_id}/files")
def list_files(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exposes workspace repository directory trees (mock list)."""
    service = ProjectService(db)
    service.get_project_by_id(project_id, current_user.uuid)
    return {
        "tree": [
            {"path": "package.json", "type": "file", "size": 1420},
            {"path": "src/App.tsx", "type": "file", "size": 6410},
            {"path": "src/index.css", "type": "file", "size": 42098},
            {"path": "src/main.tsx", "type": "file", "size": 890},
            {"path": "vite.config.ts", "type": "file", "size": 1205}
        ]
    }

@router.get("/{project_id}/repository")
def get_repository(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns active repository connection detail metadata."""
    service = ProjectService(db)
    project = service.get_project_by_id(project_id, current_user.uuid)
    metadata = project.registry_metadata
    if not metadata:
        raise HTTPException(status_code=404, detail="REPOSITORY_CONNECTION_NOT_FOUND")
    return {
        "repository_url": project.repository_url,
        "default_branch": project.default_branch,
        "connection_status": "CONNECTED",
        "webhook_enabled": metadata.webhook_enabled,
        "last_sync_at": metadata.last_sync_at,
        "last_commit_message": metadata.last_commit_message,
        "repository_size": metadata.repository_size,
        "contributors": metadata.contributors,
        "commit_count": metadata.commit_count
    }

@router.get("/{project_id}/dna")
def get_dna(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reserved endpoint: Project DNA AST structure diagnostics (Not Implemented)."""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Project DNA Engine capability is reserved for Phase 6"
    )

@router.get("/{project_id}/deployments")
def get_deployments(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reserved endpoint: Deployments targets connection list (Reserved)."""
    return []

@router.get("/{project_id}/attachments", response_model=List[ProjectAttachmentResponse])
def list_attachments(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all files attached to the project registry workspace."""
    service = ProjectService(db)
    service.get_project_by_id(project_id, current_user.uuid)
    return service.repo.list_attachments(project_id)

@router.post("/{project_id}/attachments", response_model=ProjectAttachmentResponse)
def add_attachment(
    project_id: str,
    payload: ProjectAttachmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Attaches a pitch PDF, deck document or demo video link to the project workspace."""
    service = ProjectService(db)
    return service.add_attachment(project_id, payload, current_user.uuid)

@router.get("/{project_id}/comments", response_model=List[ProjectCommentResponse])
def list_comments(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists discussions threads on a project registry."""
    service = ProjectService(db)
    service.get_project_by_id(project_id, current_user.uuid)
    return service.repo.list_comments(project_id)

@router.post("/{project_id}/comments", response_model=ProjectCommentResponse)
def add_comment(
    project_id: str,
    payload: ProjectCommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Inserts a thread post inside project workspace discussions."""
    service = ProjectService(db)
    return service.add_comment(project_id, payload, current_user.uuid)
