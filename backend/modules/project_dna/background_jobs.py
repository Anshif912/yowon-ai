import logging
import uuid
from datetime import datetime
from sqlalchemy.orm import Session

from database import BackgroundJob, RepositorySnapshot, ProjectDNASnapshot, ComparisonSession
from modules.project_dna.engine import generate_project_dna
from modules.project_dna.service import get_active_policy, run_pairwise_similarity

logger = logging.getLogger(__name__)

def execute_dna_generation_job(db: Session, job_uuid: str, project_id: str, snapshot_id: str, changed_files: list = None) -> None:
    """Runs DNA snapshot generation within background job execution framework."""
    job = db.query(BackgroundJob).filter(BackgroundJob.uuid == job_uuid).first()
    if job:
        job.status = "RUNNING"
        job.started_at = datetime.utcnow()
        db.commit()

    try:
        snapshot = db.query(RepositorySnapshot).filter(RepositorySnapshot.snapshot_id == snapshot_id).first()
        if not snapshot:
            raise ValueError(f"Snapshot {snapshot_id} not found")
            
        # Run generation
        dna_snap = generate_project_dna(db, project_id, snapshot, changed_files)
        
        if job:
            job.status = "COMPLETED"
            job.progress = 100.0
            job.completed_at = datetime.utcnow()
            job.result = f"DNA Generation succeeded: snapshot={dna_snap.uuid}"
            db.commit()
    except Exception as e:
        logger.exception("[DNA Job] DNA Generation job failed: %s", e)
        if job:
            job.status = "FAILED"
            job.error_log = str(e)
            job.completed_at = datetime.utcnow()
            db.commit()


def execute_comparison_job(db: Session, job_uuid: str, session_uuid: str) -> None:
    """Runs pairwise DNA similarity comparison within background job execution framework."""
    job = db.query(BackgroundJob).filter(BackgroundJob.uuid == job_uuid).first()
    if job:
        job.status = "RUNNING"
        job.started_at = datetime.utcnow()
        db.commit()

    try:
        session = db.query(ComparisonSession).filter(ComparisonSession.uuid == session_uuid).first()
        if not session:
            raise ValueError(f"Comparison Session {session_uuid} not found")
            
        policy = get_active_policy(db, session.workspace_id)
        run_pairwise_similarity(db, session, policy)
        
        if job:
            job.status = "COMPLETED"
            job.progress = 100.0
            job.completed_at = datetime.utcnow()
            job.result = f"Comparison complete. Similarity: {session.overall_similarity}"
            db.commit()
    except Exception as e:
        logger.exception("[DNA Job] Comparison job failed: %s", e)
        if job:
            job.status = "FAILED"
            job.error_log = str(e)
            job.completed_at = datetime.utcnow()
            db.commit()
