"""
enterprise_ai/router.py — Enterprise AI & Copilot Router

Endpoints:
  POST /enterprise-ai/copilot/query     — Main copilot query (persona-aware, memory-backed)
  GET  /enterprise-ai/copilot/personas  — List all personas
  GET  /enterprise-ai/copilot/tools     — List registered tools
  GET  /enterprise-ai/copilot/sessions  — List user sessions in workspace
  GET  /enterprise-ai/copilot/sessions/{id}/messages — Conversation history
  GET  /enterprise-ai/knowledge/search  — Hybrid knowledge search
"""

import uuid
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, User
from auth.security import get_current_user
from modules.enterprise_ai.copilot.copilot import AICopilotService
from modules.enterprise_ai.personas.registry import list_personas
from modules.enterprise_ai.tools.registry import tool_registry

router = APIRouter(prefix="/enterprise-ai", tags=["Enterprise Intelligence"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class CopilotQueryRequest(BaseModel):
    query: str
    persona_id: Optional[str] = "developer"
    session_id: Optional[str] = None
    workspace_id: str
    # Optional overrides — if omitted, live DB context is used exclusively
    raw_documents: Optional[List[Dict[str, Any]]] = None
    context_overrides: Optional[Dict[str, Any]] = None


# ── Copilot Endpoints ─────────────────────────────────────────────────────────

@router.post("/copilot/query")
async def copilot_query(
    payload: CopilotQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits a query to the AI Copilot.
    Uses live workspace context, persona-specialized tools, and session memory.
    """
    service = AICopilotService(db)
    session_id = payload.session_id or str(uuid.uuid4())
    persona_id = payload.persona_id or "developer"

    # No hardcoded defaults — pass empty lists so context builder uses live DB
    raw_docs = payload.raw_documents or []
    overrides = payload.context_overrides or {}

    try:
        response = await service.execute_query(
            query=payload.query,
            session_id=session_id,
            user_uuid=current_user.uuid,
            user_role=current_user.role,
            workspace_id=payload.workspace_id,
            persona_id=persona_id,
            raw_documents=raw_docs,
            context_overrides=overrides,
        )
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Copilot execution error: {str(exc)}"
        )


@router.get("/copilot/personas")
def list_copilot_personas(
    current_user: User = Depends(get_current_user)
):
    """Returns the list of available Copilot personas with their capabilities."""
    return {"data": list_personas()}


@router.get("/copilot/tools")
def list_copilot_tools(
    current_user: User = Depends(get_current_user)
):
    """Returns the registry of all available Copilot tools."""
    return {"data": tool_registry.list_tools()}


@router.get("/copilot/sessions")
def get_sessions(
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns all Copilot sessions for the current user in a workspace."""
    service = AICopilotService(db)
    sessions = service.get_sessions(
        workspace_id=workspace_id,
        user_id=current_user.uuid
    )
    return {"data": sessions}


@router.get("/copilot/sessions/{session_id}/messages")
def get_session_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns the full conversation history for a Copilot session."""
    service = AICopilotService(db)
    messages = service.get_messages(
        session_id=session_id,
        user_id=current_user.uuid
    )
    return {"data": messages}


# ── Knowledge Search ──────────────────────────────────────────────────────────

@router.get("/knowledge/search")
def knowledge_search(
    query: str = Query(..., min_length=1),
    workspace_id: str = Query(..., min_length=1),
    similarity_threshold: float = Query(0.5),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Performs hybrid semantic and keyword search over workspace repository files."""
    from database import Project, RepositorySnapshot, RepositoryFile
    from modules.enterprise_ai.knowledge.search import HybridKnowledgeSearch

    projects = db.query(Project).filter(Project.workspace_id == workspace_id).all()
    project_ids = [p.id for p in projects]

    snaps = db.query(RepositorySnapshot).filter(
        RepositorySnapshot.project_id.in_(project_ids) if project_ids else False
    ).all()
    snap_ids = [s.snapshot_id for s in snaps]

    files = db.query(RepositoryFile).filter(
        RepositoryFile.repository_snapshot_id.in_(snap_ids) if snap_ids else False
    ).limit(200).all()

    corpus = [
        {
            "id": f.file_id,
            "title": f.file_name,
            "content": f.content or "",
            "file_path": f.file_path,
            "project_id": f.project_id
        }
        for f in files
    ]

    searcher = HybridKnowledgeSearch()
    results = searcher.search(query, corpus, limit=10)

    formatted = []
    for r in results:
        if r.get("hybrid_score", 0) < similarity_threshold:
            continue
        p = db.query(Project).filter(Project.id == r.get("project_id")).first()
        formatted.append({
            "id": r["document_id"],
            "fileName": r["title"],
            "filePath": r.get("file_path", ""),
            "score": r["hybrid_score"],
            "snippet": (r["content"][:300] + "...") if len(r["content"]) > 300 else r["content"],
            "project": p.name if p else "unknown-project",
            "tags": [r["title"].split(".")[-1].upper()] if "." in r["title"] else ["CODE"]
        })

    return {"data": formatted}
