from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    industry: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    country: Optional[str] = None
    parent_org_id: Optional[str] = None

class OrganizationResponse(BaseModel):
    uuid: str
    name: str
    slug: str
    description: Optional[str] = None
    industry: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    country: Optional[str] = None
    parent_org_id: Optional[str] = None
    owner_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OrganizationMemberResponse(BaseModel):
    id: str
    organization_id: str
    user_id: str
    role: str
    joined_at: datetime

    class Config:
        from_attributes = True
