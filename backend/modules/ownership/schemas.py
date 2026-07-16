from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class OwnershipRecordResponse(BaseModel):
    uuid: str
    project_id: str
    owner_id: Optional[str] = None
    team_id: Optional[str] = None
    organization_id: Optional[str] = None
    ownership_type: str
    ownership_percentage: float
    verification_status: str
    joined_date: datetime
    source: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class ClaimRequestCreate(BaseModel):
    reason: str
    supporting_evidence: Optional[str] = None

class ClaimRequestResponse(BaseModel):
    uuid: str
    project_id: str
    user_id: str
    reason: str
    supporting_evidence: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class TransferRequestCreate(BaseModel):
    recipient_id: str

class TransferRequestResponse(BaseModel):
    uuid: str
    project_id: str
    current_owner_id: str
    recipient_id: str
    status: str
    verification_code: str
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True

class ReviewSubmission(BaseModel):
    status: str  # APPROVED | REJECTED | MORE_INFO_REQUESTED | ESCALATED
    notes: Optional[str] = None

class ReviewResponse(BaseModel):
    uuid: str
    project_id: str
    request_id: Optional[str] = None
    transfer_id: Optional[str] = None
    similarity_score: float
    reviewer_id: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TimelineItemResponse(BaseModel):
    event_type: str
    description: str
    timestamp: datetime
