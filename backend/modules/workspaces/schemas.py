from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    type: str = "PERSONAL"  # PERSONAL | HACKATHON | UNIVERSITY | RESEARCH | COMPANY | STARTUP
    visibility: str = "PRIVATE"  # PUBLIC | PRIVATE | INVITE_ONLY
    organization_id: Optional[str] = None

class WorkspaceResponse(BaseModel):
    workspace_id: str
    organization_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    type: str
    visibility: str
    owner_id: Optional[str] = None
    preferences: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class WorkspaceInvitationCreate(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    role: str = "TEAM_MEMBER"

class WorkspaceInvitationResponse(BaseModel):
    uuid: str
    workspace_id: str
    email: Optional[str] = None
    username: Optional[str] = None
    invite_code: str
    role: str
    invited_by: str
    status: str
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True

class WorkspaceMemberResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    role: str
    status: str
    joined_at: datetime

    class Config:
        from_attributes = True
