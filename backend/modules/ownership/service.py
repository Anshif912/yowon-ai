import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from database import (
    OwnershipRecord,
    OwnershipRequest,
    OwnershipTransfer,
    OwnershipReview,
    OwnershipActivity,
    AuditLog,
    User,
    Project,
    ProjectSource,
    Evaluation
)
from modules.ownership.repository import OwnershipRepository
from modules.ownership.schemas import (
    ClaimRequestCreate,
    TransferRequestCreate,
    ReviewSubmission,
    TimelineItemResponse
)
from core.middleware.correlation import correlation_id_ctx

class OwnershipService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = OwnershipRepository(db)

    def _audit(self, actor_id: str, event_type: str, target: str, prev: Optional[str] = None, new: Optional[str] = None):
        corr_id = correlation_id_ctx.get() or str(uuid.uuid4())
        audit = AuditLog(
            actor_id=actor_id,
            event_type=event_type,
            target_entity=target,
            previous_values=prev,
            new_values=new,
            correlation_id=corr_id,
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)

    def _log_activity(self, project_id: str, actor_id: str, event_type: str, details: str):
        activity = OwnershipActivity(
            uuid=str(uuid.uuid4()),
            project_id=project_id,
            event_type=event_type,
            actor_id=actor_id,
            details=details,
            timestamp=datetime.utcnow()
        )
        self.db.add(activity)

    def request_ownership(self, project_id: str, payload: ClaimRequestCreate, user_uuid: str) -> OwnershipRequest:
        # Check if project exists
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="PROJECT_NOT_FOUND")

        # 1. Create Request
        req = OwnershipRequest(
            uuid=str(uuid.uuid4()),
            project_id=project_id,
            user_id=user_uuid,
            reason=payload.reason,
            supporting_evidence=payload.supporting_evidence,
            status="PENDING",
            created_at=datetime.utcnow()
        )
        self.db.add(req)
        self.db.flush()

        # 2. Check if project already has owners (conflict classification)
        existing_owners = self.repo.get_records_by_project(project_id)
        similarity = 0.0
        status_review = "PENDING"
        if existing_owners:
            # We classify it as a conflict
            similarity = 85.0  # Conflict threshold trigger
            status_review = "ESCALATED"
            notes = f"Conflict classified: high similarity match with current owners."
            
            # Record timeline warning
            self._log_activity(project_id, user_uuid, "Conflict Flagged", "System flagged potential ownership dispute.")
        else:
            notes = "Standard review queue."

        # 3. Insert review log entry
        review = OwnershipReview(
            uuid=str(uuid.uuid4()),
            project_id=project_id,
            request_id=req.uuid,
            similarity_score=similarity,
            status=status_review,
            notes=notes,
            created_at=datetime.utcnow()
        )
        self.db.add(review)

        self._audit(user_uuid, "REQUEST_OWNERSHIP", project_id, None, f'{{"request_id": "{req.uuid}"}}')
        self._log_activity(project_id, user_uuid, "Owner Requested", f"User requested project ownership.")
        self.db.commit()
        return req

    def verify_ownership(self, project_id: str, request_id: str, payload: ReviewSubmission, reviewer_uuid: str) -> OwnershipReview:
        # Verify reviewer is admin or manager
        reviewer = self.db.query(User).filter(User.uuid == reviewer_uuid).first()
        if not reviewer or reviewer.role not in ["admin", "manager"]:
            raise HTTPException(status_code=403, detail="ACCESS_FORBIDDEN_REVIEW_QUEUE")

        review = self.db.query(OwnershipReview).filter(
            OwnershipReview.project_id == project_id,
            OwnershipReview.request_id == request_id
        ).first()
        if not review:
            raise HTTPException(status_code=404, detail="REVIEW_RECORD_NOT_FOUND")

        req = self.db.query(OwnershipRequest).filter(OwnershipRequest.uuid == request_id).first()
        if not req:
            raise HTTPException(status_code=404, detail="REQUEST_NOT_FOUND")

        review.status = payload.status
        review.reviewer_id = reviewer_uuid
        review.notes = payload.notes
        review.updated_at = datetime.utcnow()

        if payload.status == "APPROVED":
            req.status = "ACCEPTED"
            req.resolved_at = datetime.utcnow()
            req.resolved_by = reviewer_uuid

            # Reallocate ownership shares: Delete existing records and grant 100% to this user
            self.db.query(OwnershipRecord).filter(OwnershipRecord.project_id == project_id).delete()
            
            new_record = OwnershipRecord(
                uuid=str(uuid.uuid4()),
                project_id=project_id,
                owner_id=req.user_id,
                ownership_type="Individual",
                ownership_percentage=100.0,
                verification_status="Verified",
                joined_date=datetime.utcnow(),
                source="TRANSFER",
                notes=f"Approved in manual review by {reviewer.full_name}"
            )
            self.db.add(new_record)
            
            self._log_activity(project_id, reviewer_uuid, "Owner Added", f"Owner approved and verified.")
        elif payload.status == "REJECTED":
            req.status = "DECLINED"
            req.resolved_at = datetime.utcnow()
            req.resolved_by = reviewer_uuid
            self._log_activity(project_id, reviewer_uuid, "Claim Denied", "Governance claim rejected.")

        self._audit(reviewer_uuid, "VERIFY_OWNERSHIP", project_id, f'{{"status": "PENDING"}}', f'{{"status": "{payload.status}"}}')
        self.db.commit()
        return review

    def create_transfer(self, project_id: str, payload: TransferRequestCreate, owner_uuid: str) -> OwnershipTransfer:
        # Check permissions: owner must currently have verified shares
        owner_record = self.db.query(OwnershipRecord).filter(
            OwnershipRecord.project_id == project_id,
            OwnershipRecord.owner_id == owner_uuid,
            OwnershipRecord.verification_status == "Verified"
        ).first()
        if not owner_record:
            raise HTTPException(status_code=403, detail="ROLE_INSUFFICIENT_PERMISSIONS")

        code = f"TX-{uuid.uuid4().hex[:6].upper()}"
        transfer = OwnershipTransfer(
            uuid=str(uuid.uuid4()),
            project_id=project_id,
            current_owner_id=owner_uuid,
            recipient_id=payload.recipient_id,
            status="PENDING",
            verification_code=code,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=2)
        )
        self.db.add(transfer)
        self.db.flush()

        self._audit(owner_uuid, "INITIATE_TRANSFER", project_id, None, f'{{"recipient": "{payload.recipient_id}"}}')
        self._log_activity(project_id, owner_uuid, "Transfer Initiated", "Ownership transfer request initiated.")
        self.db.commit()
        return transfer

    def accept_transfer(self, project_id: str, code: str, recipient_uuid: str) -> OwnershipTransfer:
        transfer = self.repo.get_transfer_by_code(code)
        if not transfer or transfer.project_id != project_id:
            raise HTTPException(status_code=404, detail="TRANSFER_NOT_FOUND_OR_EXPIRED")

        if transfer.recipient_id != recipient_uuid:
            raise HTTPException(status_code=403, detail="RECIPIENT_MISMATCH")

        if transfer.expires_at < datetime.utcnow():
            transfer.status = "EXPIRED"
            self.db.commit()
            raise HTTPException(status_code=400, detail="TRANSFER_CODE_EXPIRED")

        # 1. Update transfer status
        transfer.status = "ACCEPTED"
        transfer.completed_at = datetime.utcnow()

        # 2. Shift Ownership Records from current owner to recipient
        owner_record = self.db.query(OwnershipRecord).filter(
            OwnershipRecord.project_id == project_id,
            OwnershipRecord.owner_id == transfer.current_owner_id
        ).first()
        
        if owner_record:
            owner_record.owner_id = recipient_uuid
            owner_record.notes = f"Transferred from {transfer.current_owner_id}"

        # 3. Log timeline activity
        self._log_activity(project_id, transfer.current_owner_id, "Owner Removed", "Previous owner removed.")
        self._log_activity(project_id, recipient_uuid, "Owner Added", "New owner added via secure transfer code.")

        self._audit(recipient_uuid, "COMPLETE_TRANSFER", project_id)
        self.db.commit()
        return transfer

    def get_timeline(self, project_id: str) -> List[TimelineItemResponse]:
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="PROJECT_NOT_FOUND")

        items = []

        # A. Project Registration
        items.append(TimelineItemResponse(
            event_type="Project Created",
            description=f"Project '{project.name}' registered inside the workspace registry.",
            timestamp=project.created_at
        ))

        # B. Repository Import
        source = self.db.query(ProjectSource).filter(ProjectSource.project_id == project_id).first()
        if source:
            items.append(TimelineItemResponse(
                event_type="Repository Imported",
                description=f"Source repository synced from {source.source_type}.",
                timestamp=source.last_sync_at
            ))

        # C. Evaluations runs
        evals = self.db.query(Evaluation).filter(Evaluation.project_id == project_id).all()
        for ev in evals:
            items.append(TimelineItemResponse(
                event_type="Evaluation Completed",
                description=f"AI Evaluation Finished. Score: {ev.overall_score or 0.0} | Verdict: {ev.verdict or 'Pending'}",
                timestamp=ev.timestamp
            ))

        # D. Ownership Activity Logs
        activities = self.db.query(OwnershipActivity).filter(OwnershipActivity.project_id == project_id).all()
        for ac in activities:
            items.append(TimelineItemResponse(
                event_type=ac.event_type,
                description=ac.details or "",
                timestamp=ac.timestamp
            ))

        # Sort chronologically by timestamp
        items.sort(key=lambda x: x.timestamp)
        return items
