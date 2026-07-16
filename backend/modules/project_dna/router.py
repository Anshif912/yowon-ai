import json
import logging
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header, BackgroundTasks, Query
from sqlalchemy.orm import Session

from database import (
    get_db,
    User,
    Project,
    ProjectDNASnapshot,
    ProjectDNAFeature,
    ProjectDNAFingerprint,
    ComparisonSession,
    ComparisonEvidence,
    AuditLog,
    BackgroundJob,
    RepositorySnapshot,
    SimilarityPolicy,
    WorkspaceMember,
)

def resolve_workspace_id(x_workspace_id: Optional[str], user_id: str, db: Session) -> str:
    if x_workspace_id:
        return x_workspace_id
    member = db.query(WorkspaceMember).filter(WorkspaceMember.user_id == user_id).first()
    return member.workspace_id if member else "default-ws"
from auth.security import get_current_user
from modules.project_dna.schemas import (
    DNASnapshotResponse,
    DNAFingerprintResponse,
    ComparisonSessionResponse,
    ComparisonEvidenceResponse,
    SimilarityMatrixResponse,
    DNAEvolutionResponse,
    SimilarityPolicyResponse,
    SimilarityPolicyBase,
    DNAComparisonDiffResponse,
    DNADriftResponse,
    DNAGraphResponse,
)
from modules.project_dna.service import (
    get_active_policy,
    run_pairwise_similarity,
    generate_workspace_similarity_matrix,
    search_projects_by_dna_feature,
    compute_workspace_dna_analytics,
    get_dna_diff,
    get_dna_drift,
    get_dna_graph,
    get_dna_evolution_timeline,
    export_dna_report,
    get_dna_observability_metrics,
)
from modules.project_dna.background_jobs import execute_dna_generation_job, execute_comparison_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["Project DNA"])

def verify_project_workspace(project_id: str, workspace_id: Optional[str], db: Session) -> Project:
    """Verifies that the project exists and belongs to the workspace context."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if workspace_id and project.workspace_id != workspace_id:
        raise HTTPException(status_code=403, detail="Project does not belong to active workspace")
    return project

# ── 1. Static/Global Enterprise DNA Routes (MUST be registered first) ────────

@router.get("/dna/search", response_model=List[Dict[str, Any]])
def search_dna_features(
    q: str = Query(..., min_length=2),
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """DNA Search: Finds projects across the active workspace using specific frameworks or features."""
    w_id = resolve_workspace_id(x_workspace_id, current_user.uuid, db)
    return search_projects_by_dna_feature(db, w_id, q)


@router.get("/dna/matrix", response_model=SimilarityMatrixResponse)
def get_similarity_matrix(
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Similarity Matrix: Computes cross-similarity comparisons for all workspace projects."""
    w_id = resolve_workspace_id(x_workspace_id, current_user.uuid, db)
    return generate_workspace_similarity_matrix(db, w_id)


@router.get("/dna/analytics", response_model=Dict[str, Any])
def get_dna_analytics(
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Workspace Analytics: Summarizes database, framework, and maturity analytics for a workspace."""
    w_id = resolve_workspace_id(x_workspace_id, current_user.uuid, db)
    return compute_workspace_dna_analytics(db, w_id)


@router.get("/system/metrics/dna", response_model=Dict[str, Any])
def get_system_dna_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exposes DNA Observability metrics: processing time, cache ratio, queue size."""
    return get_dna_observability_metrics(db)


# ── 2. DNA Policy Management APIs ───────────────────────────────────────────

@router.get("/dna/policies", response_model=List[SimilarityPolicyResponse])
def list_similarity_policies(
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all similarity policies available in the workspace context."""
    w_id = resolve_workspace_id(x_workspace_id, current_user.uuid, db)
    policies = db.query(SimilarityPolicy).filter(
        (SimilarityPolicy.workspace_id == w_id) | (SimilarityPolicy.workspace_id == None)
    ).all()
    return policies


@router.post("/dna/policies", response_model=SimilarityPolicyResponse)
def create_similarity_policy(
    payload: SimilarityPolicyBase,
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a custom similarity comparison policy for a workspace."""
    w_id = resolve_workspace_id(x_workspace_id, current_user.uuid, db)
    policy = SimilarityPolicy(
        uuid=str(uuid.uuid4()),
        workspace_id=w_id,
        name=payload.name,
        weight_architecture=payload.weight_architecture,
        weight_technology=payload.weight_technology,
        weight_workflow=payload.weight_workflow,
        weight_api=payload.weight_api,
        weight_security=payload.weight_security,
        weight_repository=payload.weight_repository,
        weight_deployment=payload.weight_deployment,
        weight_documentation=payload.weight_documentation,
        threshold_high_similarity=payload.threshold_high_similarity,
        ignored_paths=json.dumps(payload.ignored_paths) if payload.ignored_paths else None,
        ignored_extensions=json.dumps(payload.ignored_extensions) if payload.ignored_extensions else None
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


# ── 3. Reviewer Workflow & Action APIs ──────────────────────────────────────

@router.post("/compare/{id}/bookmark", response_model=ComparisonSessionResponse)
def toggle_session_bookmark(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Flags a comparison session as bookmarked for follow-ups."""
    session = db.query(ComparisonSession).filter(ComparisonSession.uuid == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Comparison session not found")
        
    session.reviewer_decision = "REVIEW_REQUIRED"  # Toggle review status
    session.reviewer_comment = f"{session.reviewer_comment or ''} [Bookmarked by {current_user.email}]".strip()
    db.commit()
    return session


@router.post("/compare/{id}/action", response_model=ComparisonSessionResponse)
def submit_reviewer_decision(
    id: str,
    decision: str = Query(..., regex="^(PENDING|DISMISS|REVIEW_REQUIRED|ACCEPT)$"),
    comment: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit reviewer verdict and audits history log."""
    session = db.query(ComparisonSession).filter(ComparisonSession.uuid == id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Comparison session not found")
        
    session.reviewer_decision = decision
    if comment:
        session.reviewer_comment = comment
        
    db.add(AuditLog(
        uuid=str(uuid.uuid4()),
        event_type="RESOLVE_AUTHENTICITY",
        actor_id=current_user.uuid,
        correlation_id=session.uuid,
        ip_address="127.0.0.1",
        timestamp=datetime.utcnow()
    ))
    db.commit()
    return session


# ── 4. Project-Scoped DNA APIs ──────────────────────────────────────────────

@router.post("/{id}/dna/generate", response_model=Dict[str, Any])
def generate_dna_snapshot_endpoint(
    id: str,
    background_tasks: BackgroundTasks,
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enqueues a background job to generate a DNA snapshot for a project."""
    project = verify_project_workspace(id, x_workspace_id, db)
    
    repo_snap = db.query(RepositorySnapshot).filter(
        RepositorySnapshot.repository_id.in_(
            db.query(Project.id).filter(Project.id == id)
        ) or RepositorySnapshot.repository_id != None
    ).order_by(RepositorySnapshot.snapshot_timestamp.desc()).first()
    
    if not repo_snap:
        repo_snap = db.query(RepositorySnapshot).order_by(RepositorySnapshot.snapshot_timestamp.desc()).first()
        
    if not repo_snap:
        raise HTTPException(status_code=400, detail="No repository snapshot found to extract DNA from")

    job_uuid = str(uuid.uuid4())
    job = BackgroundJob(
        uuid=job_uuid,
        project_id=id,
        job_type="DNA_GEN",
        status="QUEUED",
        priority="HIGH",
        progress=0.0
    )
    db.add(job)
    
    db.add(AuditLog(
        uuid=str(uuid.uuid4()),
        event_type="GENERATE_DNA",
        actor_id=current_user.uuid,
        correlation_id=job_uuid,
        ip_address="127.0.0.1",
        timestamp=datetime.utcnow()
    ))
    db.commit()
    
    background_tasks.add_task(execute_dna_generation_job, db, job_uuid, id, repo_snap.snapshot_id)
    return {"job_id": job_uuid, "status": "QUEUED"}


@router.get("/{id}/dna/snapshots", response_model=List[DNASnapshotResponse])
def get_dna_snapshots(
    id: str,
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all historical DNA snapshots for a project."""
    verify_project_workspace(id, x_workspace_id, db)
    snapshots = db.query(ProjectDNASnapshot).filter(
        ProjectDNASnapshot.project_id == id
    ).order_by(ProjectDNASnapshot.created_at.desc()).all()
    
    for s in snapshots:
        if s.extraction_report:
            try:
                s.extraction_report = json.loads(s.extraction_report)
            except Exception:
                pass
        if s.dna_manifest:
            try:
                s.dna_manifest = json.loads(s.dna_manifest)
            except Exception:
                pass
                
    return snapshots


@router.get("/{id}/dna/latest", response_model=DNASnapshotResponse)
@router.get("/{id}/dna", response_model=DNASnapshotResponse)
def get_latest_dna_snapshot(
    id: str,
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves the latest completed DNA snapshot for a project."""
    verify_project_workspace(id, x_workspace_id, db)
    snap = db.query(ProjectDNASnapshot).filter(
        ProjectDNASnapshot.project_id == id,
        ProjectDNASnapshot.status == "COMPLETED"
    ).order_by(ProjectDNASnapshot.created_at.desc()).first()
    
    if not snap:
        raise HTTPException(status_code=404, detail="No completed Project DNA snapshot found")
        
    if snap.extraction_report:
        try:
            snap.extraction_report = json.loads(snap.extraction_report)
        except Exception:
            pass
    if snap.dna_manifest:
        try:
            snap.dna_manifest = json.loads(snap.dna_manifest)
        except Exception:
            pass
            
    return snap


@router.post("/{id}/compare/{targetProjectId}", response_model=ComparisonSessionResponse)
def compare_projects_endpoint(
    id: str,
    targetProjectId: str,
    background_tasks: BackgroundTasks,
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enqueues a background job to compare DNA profiles of two projects."""
    if current_user.role not in ["SUPER_ADMIN", "WORKSPACE_ADMIN", "TEAM_LEADER", "TEAM_MEMBER"]:
        raise HTTPException(status_code=403, detail="RBAC role lacks comparison privileges")
        
    proj_a = verify_project_workspace(id, x_workspace_id, db)
    proj_b = verify_project_workspace(targetProjectId, x_workspace_id, db)
    
    snap_a = db.query(ProjectDNASnapshot).filter(
        ProjectDNASnapshot.project_id == id,
        ProjectDNASnapshot.status == "COMPLETED"
    ).order_by(ProjectDNASnapshot.created_at.desc()).first()
    
    snap_b = db.query(ProjectDNASnapshot).filter(
        ProjectDNASnapshot.project_id == targetProjectId,
        ProjectDNASnapshot.status == "COMPLETED"
    ).order_by(ProjectDNASnapshot.created_at.desc()).first()
    
    if not snap_a or not snap_b:
        raise HTTPException(status_code=400, detail="Both projects must have completed DNA snapshots to compare")

    # Enqueue comparison session
    session_uuid = str(uuid.uuid4())
    session = ComparisonSession(
        uuid=session_uuid,
        workspace_id=x_workspace_id or proj_a.workspace_id or "default-ws",
        user_id=current_user.uuid,
        source_project_id=id,
        target_project_id=targetProjectId,
        source_dna_snapshot_id=snap_a.uuid,
        target_dna_snapshot_id=snap_b.uuid,
        status="QUEUED"
    )
    db.add(session)
    
    job_uuid = str(uuid.uuid4())
    job = BackgroundJob(
        uuid=job_uuid,
        project_id=id,
        job_type="DNA_GEN",
        status="QUEUED",
        priority="HIGH",
        progress=0.0
    )
    db.add(job)
    
    db.add(AuditLog(
        uuid=str(uuid.uuid4()),
        event_type="COMPARE_PROJECTS",
        actor_id=current_user.uuid,
        correlation_id=session_uuid,
        ip_address="127.0.0.1",
        timestamp=datetime.utcnow()
    ))
    db.commit()
    
    background_tasks.add_task(execute_comparison_job, db, job_uuid, session_uuid)
    db.refresh(session)
    return session


@router.get("/{id}/similarity", response_model=List[ComparisonSessionResponse])
def get_project_similarity_history(
    id: str,
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all similarity comparison session records for a project."""
    verify_project_workspace(id, x_workspace_id, db)
    sessions = db.query(ComparisonSession).filter(
        (ComparisonSession.source_project_id == id) | (ComparisonSession.target_project_id == id)
    ).order_by(ComparisonSession.created_at.desc()).all()
    return sessions


@router.get("/{id}/authenticity", response_model=Dict[str, Any])
def get_project_authenticity(
    id: str,
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves authenticity recommendation summaries for a project."""
    verify_project_workspace(id, x_workspace_id, db)
    latest_session = db.query(ComparisonSession).filter(
        (ComparisonSession.source_project_id == id) | (ComparisonSession.target_project_id == id)
    ).order_by(ComparisonSession.created_at.desc()).first()
    
    if not latest_session:
        return {"recommendation": "Original", "overall_similarity": 0.0, "risk_level": "LOW"}
        
    return {
        "recommendation": latest_session.recommendation,
        "overall_similarity": latest_session.overall_similarity,
        "risk_level": latest_session.risk_level,
        "ai_summary": latest_session.ai_summary
    }


@router.get("/{id}/fingerprints", response_model=DNAFingerprintResponse)
def get_project_fingerprints(
    id: str,
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves the deterministic fingerprints matching the latest completed snapshot."""
    verify_project_workspace(id, x_workspace_id, db)
    snap = db.query(ProjectDNASnapshot).filter(
        ProjectDNASnapshot.project_id == id,
        ProjectDNASnapshot.status == "COMPLETED"
    ).order_by(ProjectDNASnapshot.created_at.desc()).first()
    
    if not snap:
        raise HTTPException(status_code=404, detail="No completed Project DNA snapshot found")
        
    finger = db.query(ProjectDNAFingerprint).filter(ProjectDNAFingerprint.dna_snapshot_id == snap.uuid).first()
    if not finger:
        raise HTTPException(status_code=404, detail="No fingerprints found for DNA snapshot")
    return finger


@router.get("/{id}/evidence", response_model=List[ComparisonEvidenceResponse])
def get_comparison_evidence(
    id: str,
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves evidence matches from the latest comparison session."""
    verify_project_workspace(id, x_workspace_id, db)
    latest_session = db.query(ComparisonSession).filter(
        (ComparisonSession.source_project_id == id) | (ComparisonSession.target_project_id == id)
    ).order_by(ComparisonSession.created_at.desc()).first()
    
    if not latest_session:
        return []
        
    evidences = db.query(ComparisonEvidence).filter(ComparisonEvidence.session_id == latest_session.uuid).all()
    return evidences


@router.get("/{id}/evolution", response_model=DNAEvolutionResponse)
def get_project_evolution(
    id: str,
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves timeline tracking of LOC and metrics progression across version snapshots."""
    verify_project_workspace(id, x_workspace_id, db)
    snapshots = db.query(ProjectDNASnapshot).filter(
        ProjectDNASnapshot.project_id == id,
        ProjectDNASnapshot.status == "COMPLETED"
    ).order_by(ProjectDNASnapshot.created_at.asc()).all()
    
    metrics_timeline = []
    for s in snapshots:
        features = db.query(ProjectDNAFeature).filter(
            ProjectDNAFeature.dna_snapshot_id == s.uuid,
            ProjectDNAFeature.dimension == "Metrics"
        ).all()
        loc = 0
        for f in features:
            if f.feature_name == "total_loc":
                loc = int(f.value)
        metrics_timeline.append({
            "version": s.version,
            "created_at": s.created_at.isoformat(),
            "total_loc": loc
        })
        
    return DNAEvolutionResponse(
        project_id=id,
        snapshots=snapshots,
        architecture_evolution=[],
        technology_evolution=[],
        metrics_timeline=metrics_timeline
    )


@router.get("/{id}/dna/diff", response_model=DNAComparisonDiffResponse)
def get_project_dna_diff(
    id: str,
    snapshot_a: str = Query(...),
    snapshot_b: str = Query(...),
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """DNA Diff Viewer: Returns side-by-side added/removed/modified features between two snapshots."""
    verify_project_workspace(id, x_workspace_id, db)
    return get_dna_diff(db, snapshot_a, snapshot_b)


@router.get("/{id}/dna/drift", response_model=DNADriftResponse)
def get_project_dna_drift(
    id: str,
    from_version: str = Query(...),
    to_version: str = Query(...),
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """DNA Drift Detection: Computes architectural, technological, and complexity drift."""
    verify_project_workspace(id, x_workspace_id, db)
    return get_dna_drift(db, id, from_version, to_version)


@router.get("/{id}/dna/graph", response_model=DNAGraphResponse)
def get_project_dna_graph(
    id: str,
    snapshot_id: str = Query(...),
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """DNA Graph: Exposes node-link network visualization coordinates for project DNA snapshots."""
    verify_project_workspace(id, x_workspace_id, db)
    return get_dna_graph(db, snapshot_id)


@router.get("/{id}/dna/export", response_model=Dict[str, Any])
def export_project_dna_package(
    id: str,
    snapshot_id: str = Query(...),
    format: str = Query("json"),
    x_workspace_id: Optional[str] = Header(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """DNA Export: Exports DNA manifest, features, and similarity evaluations to JSON or structural report."""
    verify_project_workspace(id, x_workspace_id, db)
    return export_dna_report(db, snapshot_id, format)
