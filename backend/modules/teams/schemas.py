from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class TeamCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    team_type: str = "DEVELOPMENT"  # DEVELOPMENT | RESEARCH | STARTUP | COLLEGE | COMPANY | OPEN_SOURCE

class TeamResponse(BaseModel):
    uuid: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    slug: str
    team_type: str
    status: str
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True

class TeamMemberResponse(BaseModel):
    uuid: str
    team_id: str
    user_id: str
    role: str
    joined_at: datetime
    status: str

    class Config:
        from_attributes = True

class TeamInvitationCreate(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    role: str = "TEAM_MEMBER"

class TeamInvitationResponse(BaseModel):
    uuid: str
    team_id: str
    email: Optional[str] = None
    username: Optional[str] = None
    invite_code: str
    role: str
    status: str
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True

class TeamActivityItem(BaseModel):
    event_type: str
    actor_name: str
    details: Optional[str] = None
    timestamp: datetime

class TeamDashboardResponse(BaseModel):
    team: TeamResponse
    members_count: int
    projects_count: int
    invitations_count: int
    recent_activity: List[TeamActivityItem]
