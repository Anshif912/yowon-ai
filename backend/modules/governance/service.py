import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from database import (
    GovernanceWorkflow,
    GovernanceAuditTrail,
    DecisionPolicy,
    Project,
)

def get_project_governance_workflow(db: Session, project_id: str) -> List[GovernanceWorkflow]:
    """Retrieves all governance review checkpoint steps for a project."""
    steps = db.query(GovernanceWorkflow).filter(GovernanceWorkflow.project_id == project_id).all()
    if not steps:
        # Seed default review checkpoints
        steps = [
            GovernanceWorkflow(
                uuid=str(uuid.uuid4()),
                project_id=project_id,
                step_name="Code Quality Review",
                status="PENDING",
                compliance_status="COMPLIANT"
            ),
            GovernanceWorkflow(
                uuid=str(uuid.uuid4()),
                project_id=project_id,
                step_name="Security Audit Review",
                status="PENDING",
                compliance_status="COMPLIANT"
            )
        ]
        db.add_all(steps)
        db.commit()
    return steps


def submit_governance_review(
    db: Session,
    project_id: str,
    step_name: str,
    status: str,
    reviewer_comments: Optional[str],
    reviewer_id: str
) -> GovernanceWorkflow:
    """Updates review step status, checks compliance, and writes immutable audit trail logs."""
    step = db.query(GovernanceWorkflow).filter(
        GovernanceWorkflow.project_id == project_id,
        GovernanceWorkflow.step_name == step_name
    ).first()
    
    if not step:
        step = GovernanceWorkflow(
            uuid=str(uuid.uuid4()),
            project_id=project_id,
            step_name=step_name,
            status=status,
            reviewer_comments=reviewer_comments,
            reviewed_by=reviewer_id
        )
        db.add(step)
    else:
        step.status = status
        step.reviewer_comments = reviewer_comments
        step.reviewed_by = reviewer_id

    # Compliance logic
    if status == "REJECTED":
        step.compliance_status = "NON_COMPLIANT"
    else:
        step.compliance_status = "COMPLIANT"

    # Write Audit Trail
    audit = GovernanceAuditTrail(
        uuid=str(uuid.uuid4()),
        project_id=project_id,
        action=f"SUBMIT_REVIEW_{status}",
        actor_id=reviewer_id,
        details=f"Review step '{step_name}' updated to {status}. Comments: {reviewer_comments or 'N/A'}"
    )
    db.add(audit)
    db.commit()
    return step


def get_governance_decision_policies(db: Session, workspace_id: str) -> List[DecisionPolicy]:
    """Lists enforceable decision policies for a workspace context."""
    return db.query(DecisionPolicy).filter(
        or_(DecisionPolicy.workspace_id == workspace_id, DecisionPolicy.workspace_id == None)
    ).all()
