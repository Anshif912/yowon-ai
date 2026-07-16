import uuid
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db, User
from auth.security import get_current_user
from modules.enterprise_ai.copilot.copilot import AICopilotService

router = APIRouter(prefix="/enterprise-ai", tags=["Enterprise Intelligence"])

class CopilotQueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = None
    workspace_id: str
    raw_documents: Optional[List[Dict[str, Any]]] = None
    context_overrides: Optional[Dict[str, Any]] = None

@router.post("/copilot/query")
async def copilot_query(
    payload: CopilotQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submits a query to the AI Copilot orchestrator running within organization workspace limits."""
    service = AICopilotService(db)
    session_id = payload.session_id or str(uuid.uuid4())
    
    # Defaults if none provided
    raw_docs = payload.raw_documents or [
        {"id": "doc1", "title": "Deployment Protocols", "content": "Production deployments require administrative approval and automated test pipeline success.", "required_role": "REVIEWER", "score": 0.9, "freshness": 0.8},
        {"id": "doc2", "title": "Branch Security Guidelines", "content": "Master and staging branch commits require pull requests with two reviewer sign-offs.", "required_role": "CONTRIBUTOR", "score": 0.95, "freshness": 0.9},
        {"id": "doc3", "title": "Database Retention Policy", "content": "Organization metadata database snapshots are backed up daily with 30 days retention policy.", "required_role": "WORKSPACE_ADMIN", "score": 0.7, "freshness": 0.5}
    ]
    overrides = payload.context_overrides or {
        "codebase_metrics": {
            "lines_of_code": 25000,
            "code_duplication_percentage": 5.4,
            "test_coverage_percentage": 82.1,
            "cyclomatic_complexity": 11.5
        },
        "project_dna": {
            "has_readme": True,
            "has_tests": True,
            "has_ci": True,
            "has_dockerfile": True,
            "has_license": True,
            "vulnerability_count": 0
        }
    }

    try:
        response = await service.execute_query(
            query=payload.query,
            session_id=session_id,
            user_uuid=current_user.uuid,
            user_role=current_user.role,
            workspace_id=payload.workspace_id,
            raw_documents=raw_docs,
            context_overrides=overrides
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AICopilot execution error: {str(e)}"
        )

@router.get("/knowledge/search")
def knowledge_search(
    query: str = Query(..., min_length=1),
    workspace_id: str = Query(..., min_length=1),
    similarity_threshold: float = Query(0.8),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Performs hybrid semantic and keyword search over workspace repository files."""
    from database import Project, RepositorySnapshot, RepositoryFile
    # Find active projects in workspace
    projects = db.query(Project).filter(Project.workspace_id == workspace_id).all()
    project_ids = [p.id for p in projects]
    
    # Get snapshots
    snaps = db.query(RepositorySnapshot).filter(
        RepositorySnapshot.project_id.in_(project_ids) if project_ids else False
    ).all()
    snap_ids = [s.snapshot_id for s in snaps]
    
    # Fetch files content
    files = db.query(RepositoryFile).filter(
        RepositoryFile.repository_snapshot_id.in_(snap_ids) if snap_ids else False
    ).all()
    
    # Run searcher
    from modules.enterprise_ai.knowledge.search import HybridKnowledgeSearch
    searcher = HybridKnowledgeSearch()
    
    corpus = []
    for f in files:
        corpus.append({
            "id": f.file_id,
            "title": f.file_name,
            "content": f.content or "",
            "file_path": f.file_path,
            "project_id": f.project_id
        })
        
    results = searcher.search(query, corpus, limit=10)
    
    # Format for frontend search results
    formatted = []
    for r in results:
        # Get project name
        p = db.query(Project).filter(Project.id == r.get("project_id")).first()
        formatted.append({
            "id": r["document_id"],
            "fileName": r["title"],
            "filePath": r.get("file_path", ""),
            "score": r["hybrid_score"],
            "snippet": (r["content"][:200] + "...") if len(r["content"]) > 200 else r["content"],
            "project": p.name if p else "unknown-project",
            "tags": [r["title"].split(".")[-1].upper()] if "." in r["title"] else ["CODE"]
        })
        
    return {"data": formatted}
