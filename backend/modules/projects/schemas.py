from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ProjectCreate(BaseModel):
    name: str = Field(..., max_length=255)
    project_type: str = "Hackathon Project"
    description: Optional[str] = None
    github_url: Optional[str] = None
    team_id: Optional[str] = None
    visibility: str = "PRIVATE"
    tags: Optional[str] = None
    category: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    workspace_id: Optional[str] = None
    team_id: Optional[str] = None
    name: str
    slug: Optional[str] = None
    project_type: str
    description: Optional[str] = None
    github_url: Optional[str] = None
    demo_video_url: Optional[str] = None
    pdf_path: Optional[str] = None
    ppt_path: Optional[str] = None
    
    visibility: str
    tags: Optional[str] = None
    category: Optional[str] = None
    repository_url: Optional[str] = None
    default_branch: Optional[str] = None
    readme_snapshot: Optional[str] = None
    current_version: str
    
    status: str
    created_by: Optional[str] = None
    updated_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectVersionCreate(BaseModel):
    version: str
    tag: Optional[str] = None
    branch: Optional[str] = None
    commit_sha: Optional[str] = None
    readme_snapshot: Optional[str] = None

class ProjectVersionResponse(BaseModel):
    uuid: str
    project_id: str
    version: str
    tag: Optional[str] = None
    branch: Optional[str] = None
    commit_sha: Optional[str] = None
    snapshot_path: Optional[str] = None
    readme_snapshot: Optional[str] = None
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True

class ProjectAttachmentCreate(BaseModel):
    name: str
    file_path: str
    file_type: str = "Document"  # Architecture Diagram | Pitch Deck | Demo Video | Screenshots | Research Paper | Certificates | Documents | Other

class ProjectAttachmentResponse(BaseModel):
    uuid: str
    project_id: str
    name: str
    file_path: str
    file_type: str
    uploaded_by: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

class ProjectCommentCreate(BaseModel):
    content: str
    parent_id: Optional[str] = None

class ProjectCommentResponse(BaseModel):
    uuid: str
    project_id: str
    user_id: str
    parent_id: Optional[str] = None
    content: str
    is_pinned: bool
    is_resolved: bool
    created_at: datetime
    replies: List['ProjectCommentResponse'] = []

    class Config:
        from_attributes = True

# Resolve circular reference for nested list type
ProjectCommentResponse.model_rebuild()

class ProjectImportCreate(BaseModel):
    repository_url: str
    default_branch: Optional[str] = "main"

class ProjectSearchItem(BaseModel):
    entity_type: str  # project | file | comment | ownership | evaluation
    entity_id: str
    title: str
    subtitle: Optional[str] = None
    snippet: Optional[str] = None
    url: str
