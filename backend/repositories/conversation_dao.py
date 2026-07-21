"""
repositories/conversation_dao.py — Conversation & Memory Data Access Object (DAO)

Encapsulates database persistence for Copilot chat sessions, message logs,
and multi-scoped AI memory entries (Conversation, Workspace, Repository, Organization).
"""

import uuid
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from database import CopilotSession

logger = logging.getLogger("yowon.conversation.dao")


class ConversationDAO:
    """Encapsulates SQL / ORM operations for Copilot sessions and conversation memory."""

    def __init__(self, db: Session):
        self.db = db

    def get_session(self, session_id: str) -> Optional[CopilotSession]:
        """Retrieves a CopilotSession by UUID."""
        return self.db.query(CopilotSession).filter(CopilotSession.uuid == session_id).first()

    def list_sessions(self, workspace_id: str, persona_id: Optional[str] = None) -> List[CopilotSession]:
        """Lists chat sessions for active workspace context."""
        query = self.db.query(CopilotSession).filter(CopilotSession.workspace_id == workspace_id)
        if persona_id:
            query = query.filter(CopilotSession.persona_id == persona_id)
        return query.order_by(CopilotSession.created_at.desc()).all()

    def create_session(
        self,
        workspace_id: str,
        persona_id: str = "cto",
        user_id: Optional[str] = None,
        title: Optional[str] = None
    ) -> CopilotSession:
        """Creates a new CopilotSession record."""
        session = CopilotSession(
            uuid=str(uuid.uuid4()),
            workspace_id=workspace_id,
            user_id=user_id,
            persona_id=persona_id,
            title=title or f"Chat ({persona_id.upper()})",
            created_at=datetime.utcnow()
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session
