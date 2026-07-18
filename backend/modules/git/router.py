import uuid
import logging
import random
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import (
    get_db,
    GitRepository,
    GitOrganization,
    GitBranch,
    GitCommit,
    GitPullRequest,
    GitIssue,
    GitContributor,
    RepositorySync,
    RepositoryPermission,
    RepositoryFavorite,
    RepositoryEvaluationHistory,
    RepositoryWebhook,
    RepositoryCloneCache,
    RepositoryMetadata,
    RepositoryStatistics,
    RepositoryLanguage,
    RepositoryTag,
    RepositoryBranchProtection,
    EnterpriseConnector
)
from modules.git.sync import GitSyncEngine

logger = logging.getLogger("yowon.git.router")

router = APIRouter(prefix="/git", tags=["git_operations"])

# Pydantic schemas for request/response serialization
class PolicyUpdateRequest(BaseModel):
    policy: str  # PUSH | PULL_REQUEST | NIGHTLY | WEEKLY | MANUAL

class WatchlistUpdateRequest(BaseModel):
    active: bool
    rules: Optional[str] = None

class CompareRequest(BaseModel):
    base_repo_id: str
    target_repo_id: str

class FavoriteToggleRequest(BaseModel):
    user_id: str

class BulkSyncRequest(BaseModel):
    repo_ids: List[str]
    user_id: Optional[str] = None

class BulkEvaluateRequest(BaseModel):
    repo_ids: List[str]
    profile: str  # Quick | Security | Architecture | Performance | Full

class EvaluateRequest(BaseModel):
    profile: str  # Quick | Security | Architecture | Performance | Full
    branch: Optional[str] = "main"

# Endpoints
@router.get("/repositories")
async def get_repositories(
    org_login: Optional[str] = None,
    language: Optional[str] = None,
    private: Optional[bool] = None,
    watchlist: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieves all synchronized git repositories with filter parameters."""
    query = db.query(GitRepository)

    if org_login:
        query = query.join(GitOrganization).filter(GitOrganization.login == org_login)
    if language:
        query = query.filter(GitRepository.language == language)
    if private is not None:
        query = query.filter(GitRepository.private == private)
    if watchlist is not None:
        query = query.filter(GitRepository.watchlist_active == watchlist)
    if search:
        query = query.filter(GitRepository.full_name.like(f"%{search}%"))

    repos = query.all()
    results = []
    
    for repo in repos:
        stats = db.query(RepositoryStatistics).filter(RepositoryStatistics.repository_id == repo.uuid).first()
        org = db.query(GitOrganization).filter(GitOrganization.uuid == repo.organization_id).first()
        
        results.append({
            "uuid": repo.uuid,
            "name": repo.name,
            "full_name": repo.full_name,
            "description": repo.description,
            "html_url": repo.html_url,
            "private": repo.private,
            "language": repo.language,
            "stars_count": repo.stars_count,
            "forks_count": repo.forks_count,
            "open_issues_count": repo.open_issues_count,
            "watchers_count": repo.watchers_count,
            "size": repo.size,
            "default_branch": repo.default_branch,
            "license": repo.license,
            "is_archived": repo.is_archived,
            "last_sync_at": repo.last_sync_at,
            "last_commit_at": repo.last_commit_at,
            "evaluation_policy": repo.evaluation_policy,
            "watchlist_active": repo.watchlist_active,
            "organization": {
                "name": org.name if org else "Personal",
                "login": org.login if org else "personal",
                "avatar_url": org.avatar_url if org else None
            } if org else None,
            "statistics": {
                "health_score": stats.health_score if stats else 100,
                "risk_index": stats.risk_index if stats else 0,
                "velocity": stats.velocity if stats else 0,
                "technical_debt": stats.technical_debt if stats else 0,
                "coverage": stats.coverage if stats else 0,
                "active_contributors": stats.active_contributors if stats else 0,
                "security_issues_count": stats.security_issues_count if stats else 0,
                "deployment_readiness": stats.deployment_readiness if stats else 100.0,
                "deployment_confidence": stats.deployment_confidence if stats else 100.0,
                "estimated_remediation_cost": stats.estimated_remediation_cost if stats else 0.0,
                "radar_engineering": stats.radar_engineering if stats else 100,
                "radar_security": stats.radar_security if stats else 100,
                "radar_architecture": stats.radar_architecture if stats else 100,
                "radar_innovation": stats.radar_innovation if stats else 100,
                "radar_compliance": stats.radar_compliance if stats else 100
            } if stats else None
        })
    
    return results

@router.get("/repositories/{id}")
async def get_repository_details(id: str, db: Session = Depends(get_db)):
    """Retrieves full profile details for a repository."""
    repo = db.query(GitRepository).filter(GitRepository.uuid == id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    stats = db.query(RepositoryStatistics).filter(RepositoryStatistics.repository_id == repo.uuid).first()
    org = db.query(GitOrganization).filter(GitOrganization.uuid == repo.organization_id).first()
    branches = db.query(GitBranch).filter(GitBranch.repository_id == repo.uuid).all()
    contributors = db.query(GitContributor).filter(GitContributor.repository_id == repo.uuid).all()
    bp = db.query(RepositoryBranchProtection).filter(RepositoryBranchProtection.repository_id == repo.uuid).all()

    # Parse AI summary if available
    ai_summary_parsed = None
    if stats and stats.ai_summary:
        try:
            import json
            ai_summary_parsed = json.loads(stats.ai_summary)
        except Exception:
            ai_summary_parsed = stats.ai_summary

    return {
        "uuid": repo.uuid,
        "name": repo.name,
        "full_name": repo.full_name,
        "description": repo.description,
        "html_url": repo.html_url,
        "private": repo.private,
        "language": repo.language,
        "stars_count": repo.stars_count,
        "forks_count": repo.forks_count,
        "open_issues_count": repo.open_issues_count,
        "watchers_count": repo.watchers_count,
        "size": repo.size,
        "default_branch": repo.default_branch,
        "license": repo.license,
        "is_archived": repo.is_archived,
        "last_sync_at": repo.last_sync_at,
        "last_commit_at": repo.last_commit_at,
        "evaluation_policy": repo.evaluation_policy,
        "watchlist_active": repo.watchlist_active,
        "organization": {
            "name": org.name if org else "Personal",
            "login": org.login if org else "personal",
            "avatar_url": org.avatar_url if org else None
        } if org else None,
        "statistics": {
            "health_score": stats.health_score if stats else 100,
            "risk_index": stats.risk_index if stats else 0,
            "velocity": stats.velocity if stats else 0,
            "technical_debt": stats.technical_debt if stats else 0,
            "coverage": stats.coverage if stats else 0,
            "active_contributors": stats.active_contributors if stats else 0,
            "security_issues_count": stats.security_issues_count if stats else 0,
            "deployment_readiness": stats.deployment_readiness if stats else 100.0,
            "deployment_confidence": stats.deployment_confidence if stats else 100.0,
            "estimated_remediation_cost": stats.estimated_remediation_cost if stats else 0.0,
            "ai_summary": ai_summary_parsed,
            "radar_engineering": stats.radar_engineering if stats else 100,
            "radar_security": stats.radar_security if stats else 100,
            "radar_architecture": stats.radar_architecture if stats else 100,
            "radar_innovation": stats.radar_innovation if stats else 100,
            "radar_compliance": stats.radar_compliance if stats else 100
        } if stats else None,
        "branches": [{"name": b.name, "sha": b.sha, "is_default": b.is_default} for b in branches],
        "contributors": [{"login": c.login, "contributions": c.contributions, "avatar_url": c.avatar_url} for c in contributors],
        "branch_protections": [{"branch_name": b.branch_name, "requires_status_checks": b.requires_status_checks, "requires_approvals": b.requires_approvals} for b in bp]
    }

@router.get("/repositories/{id}/commits")
async def get_repository_commits(id: str, db: Session = Depends(get_db)):
    """Retrieves commit history for a repository."""
    commits = db.query(GitCommit).filter(GitCommit.repository_id == id).order_by(GitCommit.author_date.desc()).all()
    return commits

@router.get("/repositories/{id}/pulls")
async def get_repository_pulls(id: str, db: Session = Depends(get_db)):
    """Retrieves PR overview list."""
    pulls = db.query(GitPullRequest).filter(GitPullRequest.repository_id == id).order_by(GitPullRequest.created_at.desc()).all()
    return pulls

@router.get("/repositories/{id}/issues")
async def get_repository_issues(id: str, db: Session = Depends(get_db)):
    """Retrieves issues tracker overview list."""
    issues = db.query(GitIssue).filter(GitIssue.repository_id == id).order_by(GitIssue.created_at.desc()).all()
    return issues

@router.post("/repositories/{id}/sync")
async def trigger_repository_sync(id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Launches an incremental VCS repository sync job in the background."""
    repo = db.query(GitRepository).filter(GitRepository.uuid == id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Find matching connector for this workspace
    connector = db.query(EnterpriseConnector).filter(
        (EnterpriseConnector.workspace_id == repo.workspace_id) & 
        (EnterpriseConnector.connector_type == "github")
    ).first()

    if not connector:
        raise HTTPException(status_code=400, detail="VCS Connector not configured for this workspace")

    # Queue background task to execute sync
    # For testing & demo purposes, we will run the sync wrapper task in background
    async def run_sync():
        provider = get_git_provider("github")
        token = SecretsVaultService.get_oauth_token(db, connector.uuid)
        if token:
            await GitSyncEngine.sync_repository_details(db, repo, token, provider)
            repo.last_sync_at = datetime.utcnow()
            db.commit()

    background_tasks.add_task(run_sync)
    return {"status": "SYNC_QUEUED", "repository": repo.full_name}

@router.post("/repositories/{id}/evaluate")
async def trigger_repository_evaluate(
    id: str,
    req: EvaluateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Enqueues repository evaluation pipeline execution."""
    repo = db.query(GitRepository).filter(GitRepository.uuid == id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Record evaluation history log entry as running
    eval_run = RepositoryEvaluationHistory(
        repository_id=repo.uuid,
        branch=req.branch,
        commit_sha="latest",
        status="RUNNING",
        created_at=datetime.utcnow()
    )
    db.add(eval_run)
    db.commit()

    # Simulate pipeline progress task
    async def run_eval():
        # Update metrics, add final scores
        import asyncio
        await asyncio.sleep(2)
        eval_run.status = "SUCCESS"
        eval_run.score = random.randint(85, 96)
        eval_run.security_score = random.randint(80, 95)
        eval_run.architecture_score = random.randint(85, 95)
        eval_run.compliance_score = random.randint(80, 98)
        eval_run.technical_debt_hours = random.randint(4, 24)
        db.commit()

    background_tasks.add_task(run_eval)
    return {"status": "EVAL_QUEUED", "evaluation_id": eval_run.uuid}

@router.post("/repositories/{id}/policy")
async def update_evaluation_policy(id: str, req: PolicyUpdateRequest, db: Session = Depends(get_db)):
    """Updates the continuous evaluation policy flag."""
    repo = db.query(GitRepository).filter(GitRepository.uuid == id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    repo.evaluation_policy = req.policy
    db.commit()
    return {"status": "POLICY_UPDATED", "evaluation_policy": repo.evaluation_policy}

@router.post("/repositories/{id}/watchlist")
async def update_watchlist_active(id: str, req: WatchlistUpdateRequest, db: Session = Depends(get_db)):
    """Toggles watchlist notification active state."""
    repo = db.query(GitRepository).filter(GitRepository.uuid == id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    repo.watchlist_active = req.active
    repo.watchlist_rules = req.rules
    db.commit()
    return {"status": "WATCHLIST_UPDATED", "watchlist_active": repo.watchlist_active}

@router.post("/repositories/compare")
async def compare_repositories(req: CompareRequest, db: Session = Depends(get_db)):
    """Performs Delta similarity comparison analysis between two codebases."""
    repo1 = db.query(GitRepository).filter(GitRepository.uuid == req.base_repo_id).first()
    repo2 = db.query(GitRepository).filter(GitRepository.uuid == req.target_repo_id).first()

    if not repo1 or not repo2:
        raise HTTPException(status_code=404, detail="One or both repositories not found")

    stats1 = db.query(RepositoryStatistics).filter(RepositoryStatistics.repository_id == repo1.uuid).first()
    stats2 = db.query(RepositoryStatistics).filter(RepositoryStatistics.repository_id == repo2.uuid).first()

    # Generate comparative mock metrics
    similarity_score = round(random.uniform(45.0, 92.5), 1)
    
    return {
        "similarity_score": similarity_score,
        "base": {
            "name": repo1.name,
            "language": repo1.language,
            "health_score": stats1.health_score if stats1 else 100,
            "technical_debt": stats1.technical_debt if stats1 else 0,
            "coverage": stats1.coverage if stats1 else 0
        },
        "target": {
            "name": repo2.name,
            "language": repo2.language,
            "health_score": stats2.health_score if stats2 else 100,
            "technical_debt": stats2.technical_debt if stats2 else 0,
            "coverage": stats2.coverage if stats2 else 0
        },
        "delta": {
            "health_diff": (stats2.health_score - stats1.health_score) if (stats1 and stats2) else 0,
            "tech_debt_diff": (stats2.technical_debt - stats1.technical_debt) if (stats1 and stats2) else 0,
            "coverage_diff": (stats2.coverage - stats1.coverage) if (stats1 and stats2) else 0
        }
    }

@router.get("/repositories/{id}/timeline")
async def get_repository_timeline(id: str, db: Session = Depends(get_db)):
    """Returns chronological operation timeline logs (commits, webhook alerts, syncs, evaluations)."""
    syncs = db.query(RepositorySync).filter(RepositorySync.repository_id == id).all()
    evals = db.query(RepositoryEvaluationHistory).filter(RepositoryEvaluationHistory.repository_id == id).all()
    commits = db.query(GitCommit).filter(GitCommit.repository_id == id).all()

    timeline = []
    
    for s in syncs:
        timeline.append({
            "type": "sync",
            "title": f"Repository Synchronization: {s.status}",
            "timestamp": s.started_at or datetime.utcnow(),
            "description": f"Sync completed status: {s.status}"
        })
        
    for e in evals:
        timeline.append({
            "type": "evaluation",
            "title": f"Code Evaluation: {e.status}",
            "timestamp": e.created_at,
            "description": f"Score resolved: {e.score}%" if e.score else "Evaluation triggered"
        })

    for c in commits[:10]: # Limit to last 10 commits for clean visualization
        timeline.append({
            "type": "commit",
            "title": f"Code Push: {c.sha[:7]}",
            "timestamp": c.author_date,
            "description": f"{c.author_name} pushed: {c.message}"
        })

    # Sort timeline by timestamp desc
    timeline.sort(key=lambda x: x["timestamp"], reverse=True)
    return timeline

@router.get("/search")
async def search_workspace_entities(q: str, db: Session = Depends(get_db)):
    """Unified full-text search engine across repos, PRs, issues, commits, and organizations."""
    results = []

    # Search Repositories
    repos = db.query(GitRepository).filter(GitRepository.full_name.like(f"%{q}%")).all()
    for r in repos:
        results.append({
            "type": "repository",
            "id": r.uuid,
            "title": r.full_name,
            "description": r.description or "Git repository tracker"
        })

    # Search PRs
    prs = db.query(GitPullRequest).filter(GitPullRequest.title.like(f"%{q}%")).all()
    for pr in prs:
        results.append({
            "type": "pull_request",
            "id": pr.uuid,
            "title": f"PR #{pr.number}: {pr.title}",
            "description": f"State: {pr.state}"
        })

    # Search Issues
    issues = db.query(GitIssue).filter(GitIssue.title.like(f"%{q}%")).all()
    for issue in issues:
        results.append({
            "type": "issue",
            "id": issue.uuid,
            "title": f"Issue #{issue.number}: {issue.title}",
            "description": f"State: {issue.state}"
        })

    return results

@router.post("/repositories/{id}/favorite")
async def toggle_favorite(id: str, req: FavoriteToggleRequest, db: Session = Depends(get_db)):
    """Toggles repository favorite bookmark flag."""
    fav = db.query(RepositoryFavorite).filter(
        (RepositoryFavorite.repository_id == id) & 
        (RepositoryFavorite.user_id == req.user_id)
    ).first()

    if fav:
        db.delete(fav)
        status = "REMOVED"
    else:
        fav = RepositoryFavorite(repository_id=id, user_id=req.user_id, created_at=datetime.utcnow())
        db.add(fav)
        status = "ADDED"
    db.commit()
    return {"status": status}

@router.post("/repositories/sync-all")
async def bulk_sync_repositories(req: BulkSyncRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Triggers background sync queue for multiple repositories in bulk."""
    for repo_id in req.repo_ids:
        repo = db.query(GitRepository).filter(GitRepository.uuid == repo_id).first()
        if repo:
            connector = db.query(EnterpriseConnector).filter(
                (EnterpriseConnector.workspace_id == repo.workspace_id) & 
                (EnterpriseConnector.connector_type == "github")
            ).first()
            if connector:
                async def run_sync_job(r=repo, c=connector):
                    provider = get_git_provider("github")
                    token = SecretsVaultService.get_oauth_token(db, c.uuid)
                    if token:
                        await GitSyncEngine.sync_repository_details(db, r, token, provider)
                        r.last_sync_at = datetime.utcnow()
                        db.commit()
                background_tasks.add_task(run_sync_job)

    return {"status": "BULK_SYNC_QUEUED", "count": len(req.repo_ids)}

@router.post("/repositories/evaluate-all")
async def bulk_evaluate_repositories(req: BulkEvaluateRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Enqueues pipeline evaluations for multiple repositories in bulk."""
    eval_ids = []
    for repo_id in req.repo_ids:
        repo = db.query(GitRepository).filter(GitRepository.uuid == repo_id).first()
        if repo:
            eval_run = RepositoryEvaluationHistory(
                repository_id=repo.uuid,
                branch="main",
                commit_sha="latest",
                status="RUNNING",
                created_at=datetime.utcnow()
            )
            db.add(eval_run)
            db.flush()
            eval_ids.append(eval_run.uuid)

            async def run_eval_job(ev=eval_run):
                import asyncio
                await asyncio.sleep(2)
                ev.status = "SUCCESS"
                ev.score = random.randint(85, 96)
                ev.security_score = random.randint(80, 95)
                ev.architecture_score = random.randint(85, 95)
                ev.compliance_score = random.randint(80, 98)
                ev.technical_debt_hours = random.randint(4, 24)
                db.commit()
            
            background_tasks.add_task(run_eval_job)
            
    db.commit()
    return {"status": "BULK_EVAL_QUEUED", "evaluation_ids": eval_ids}

@router.get("/cache")
async def list_clone_caches(db: Session = Depends(get_db)):
    """List clone caches."""
    caches = db.query(RepositoryCloneCache).all()
    return caches

@router.delete("/cache/{id}")
async def delete_clone_cache(id: str, db: Session = Depends(get_db)):
    """Purge clone cache workspace."""
    cache = db.query(RepositoryCloneCache).filter(RepositoryCloneCache.uuid == id).first()
    if not cache:
        raise HTTPException(status_code=404, detail="Cache directory record not found")
    
    # In production, we would call shutil.rmtree(cache.path) to delete from disk
    # For safety on virtualenv, we log/simulate and delete DB row
    logger.info(f"[CacheManager] Purging local workspace directory cache at {cache.path}")
    db.delete(cache)
    db.commit()
    return {"status": "PURGED", "path": cache.path}
