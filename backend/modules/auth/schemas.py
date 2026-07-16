from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class UserLogin(BaseModel):
    email: str = Field(..., description="Email address of the user")
    password: str = Field(..., description="Plain password")

class UserResponse(BaseModel):
    uuid: str
    email: str
    full_name: str
    role: str
    status: str
    avatar_url: Optional[str] = None
    email_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    preferences: Optional[str] = None
    timezone: str
    language: str

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class SetupOrganization(BaseModel):
    organization_name: str = Field(..., min_length=1, max_length=100)
    admin_name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., description="Email address of the administrator")
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")

class BootstrapResponse(BaseModel):
    platform_initialized: bool
    administrator_exists: bool
    organizations: int
    providers: List[str]
    registration_allowed: bool
    providers_metadata: Dict[str, Dict[str, Any]]

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., description="Email address of the user")
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")
