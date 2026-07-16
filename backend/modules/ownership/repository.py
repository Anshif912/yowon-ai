from typing import List, Optional
from sqlalchemy.orm import Session
from database import OwnershipRecord, OwnershipRequest, OwnershipTransfer, OwnershipReview, OwnershipActivity

class OwnershipRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_records_by_project(self, project_id: str) -> List[OwnershipRecord]:
        return self.db.query(OwnershipRecord).filter(
            OwnershipRecord.project_id == project_id
        ).all()

    def get_requests_by_project(self, project_id: str) -> List[OwnershipRequest]:
        return self.db.query(OwnershipRequest).filter(
            OwnershipRequest.project_id == project_id
        ).all()

    def get_active_transfer(self, transfer_uuid: str) -> Optional[OwnershipTransfer]:
        return self.db.query(OwnershipTransfer).filter(
            OwnershipTransfer.uuid == transfer_uuid,
            OwnershipTransfer.status == "PENDING"
        ).first()

    def get_transfer_by_code(self, code: str) -> Optional[OwnershipTransfer]:
        return self.db.query(OwnershipTransfer).filter(
            OwnershipTransfer.verification_code == code,
            OwnershipTransfer.status == "PENDING"
        ).first()
