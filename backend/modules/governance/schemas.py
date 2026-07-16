from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class GovernanceWorkflowResponse(BaseModel):
    uuid: str
    project_id: str
    step_name: str
    status: str
    assigned_to: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewer_comments: Optional[str] = None
    compliance_status: str
    updated_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewSubmitRequest(BaseModel):
    status: str  # APPROVED | REJECTED | EXCEPTION
    reviewer_comments: Optional[str] = None
