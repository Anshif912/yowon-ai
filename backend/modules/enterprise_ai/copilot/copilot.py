"""
copilot/copilot.py — AICopilotService with Session Memory

Full pipeline: Context Assembly → Persona Loading → Planning → Execution
→ Memory Persistence → Audit Logging.
"""

import uuid
import json
import time
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from database import AuditLog, CopilotSession, CopilotMessage
from modules.enterprise_ai.orchestrator.coordinator import AICoordinator
from modules.enterprise_ai.context.builder import ContextBuilder
from modules.enterprise_ai.tools.registry import tool_registry
# Import all tool implementations so they register on package load
import modules.enterprise_ai.tools.implementations  # noqa: F401

logger = logging.getLogger("yowon.copilot")


class AICopilotService:
    def __init__(self, db: Session):
        self.db = db
        self.coordinator = AICoordinator()
        self.context_builder = ContextBuilder()

    async def execute_query(
        self,
        query: str,
        session_id: str,
        user_uuid: str,
        user_role: str,
        workspace_id: str,
        persona_id: str,
        raw_documents: List[Dict[str, Any]],
        context_overrides: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Runs the complete Copilot pipeline:
        1. Load conversation history from DB
        2. Build live workspace context
        3. Coordinate persona-aware tool execution
        4. Persist user + assistant messages
        5. Write audit log
        """
        start_time = time.perf_counter()

        # 1. Resolve or create CopilotSession
        session = self._get_or_create_session(session_id, user_uuid, workspace_id, persona_id)

        # 2. Load prior conversation history (last 10 messages)
        history = self._load_history(session.uuid)

        # 3. Build live workspace context from DB
        assembled_context = self.context_builder.build_context(
            query=query,
            workspace_id=workspace_id,
            user_role=user_role,
            raw_documents=raw_documents,
            db=self.db
        )

        # Merge overrides + history into context
        full_context = {
            **assembled_context,
            **{k: v for k, v in context_overrides.items() if k not in assembled_context},
            "conversation_history": history,
        }

        # 4. Coordinate execution (persona-aware)
        result = await self.coordinator.coordinate_execution(
            query=query,
            context=full_context,
            persona_id=persona_id
        )
        execution_time_ms = int((time.perf_counter() - start_time) * 1000)

        # 5. Persist messages
        self._persist_user_message(session.uuid, query)
        self._persist_assistant_message(
            session_uuid=session.uuid,
            content=result.get("response", ""),
            tool_calls=result.get("executions", []),
            evidence=result.get("evidence", []),
            execution_time_ms=execution_time_ms
        )

        # Update session last_active_at
        session.last_active_at = datetime.utcnow()
        self.db.commit()

        # 6. Audit log for tool invocations
        for execution in result.get("executions", []):
            if execution.get("status") == "success":
                audit = AuditLog(
                    uuid=str(uuid.uuid4()),
                    actor_id=user_uuid,
                    event_type="COPILOT_TOOL_INVOCATION",
                    target_entity=execution["tool"],
                    correlation_id=session.uuid,
                    workspace_id=workspace_id,
                    timestamp=datetime.utcnow()
                )
                self.db.add(audit)
        self.db.commit()

        return {
            "session_id": session.uuid,
            "persona_id": persona_id,
            "query": query,
            "response": result.get("response", ""),
            "evidence": result.get("evidence", []),
            "suggestions": self._extract_suggestions(result.get("response", "")),
            "context_summary": {
                "documents_included": len(assembled_context.get("documents", [])),
                "projects_loaded": len(assembled_context.get("projects", [])),
                "tokens_used": assembled_context.get("tokens_used", 0),
            },
            "orchestration": {
                "plan": result.get("plan", {}),
                "executions": result.get("executions", []),
                "status": result.get("status", "completed"),
            },
            "execution_time_ms": execution_time_ms,
        }

    def _get_or_create_session(
        self, session_id: str, user_id: str, workspace_id: str, persona_id: str
    ) -> CopilotSession:
        """Loads existing session or creates a new one."""
        session = self.db.query(CopilotSession).filter(CopilotSession.uuid == session_id).first()
        if not session:
            session = CopilotSession(
                uuid=session_id,
                workspace_id=workspace_id,
                user_id=user_id,
                persona_id=persona_id,
            )
            self.db.add(session)
            self.db.commit()
            logger.info(f"[Copilot] Created new session {session_id} for persona={persona_id}")
        return session

    def _load_history(self, session_uuid: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Returns last N messages for the session as context."""
        messages = (
            self.db.query(CopilotMessage)
            .filter(CopilotMessage.session_id == session_uuid)
            .order_by(CopilotMessage.created_at.desc())
            .limit(limit)
            .all()
        )
        return [
            {"role": m.role, "content": m.content[:500]}
            for m in reversed(messages)
        ]

    def _persist_user_message(self, session_uuid: str, content: str) -> None:
        msg = CopilotMessage(
            uuid=str(uuid.uuid4()),
            session_id=session_uuid,
            role="user",
            content=content,
        )
        self.db.add(msg)

    def _persist_assistant_message(
        self,
        session_uuid: str,
        content: str,
        tool_calls: List[Dict[str, Any]],
        evidence: List[Dict[str, Any]],
        execution_time_ms: int
    ) -> None:
        msg = CopilotMessage(
            uuid=str(uuid.uuid4()),
            session_id=session_uuid,
            role="assistant",
            content=content,
            tool_calls_json=json.dumps([{"tool": e["tool"], "status": e["status"]} for e in tool_calls]),
            evidence_json=json.dumps(evidence[:10]),
            execution_time_ms=execution_time_ms,
        )
        self.db.add(msg)

    def _extract_suggestions(self, response_text: str) -> List[str]:
        """Extracts follow-up suggestion lines from the formatted response."""
        suggestions = []
        capture = False
        for line in response_text.split("\n"):
            if "Suggested next questions" in line:
                capture = True
                continue
            if capture and line.startswith("- _"):
                suggestions.append(line[3:].rstrip("_"))
            elif capture and line.startswith("---"):
                break
        return suggestions[:3]

    def get_sessions(self, workspace_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Returns all Copilot sessions for this user in the workspace."""
        sessions = (
            self.db.query(CopilotSession)
            .filter(
                CopilotSession.workspace_id == workspace_id,
                CopilotSession.user_id == user_id
            )
            .order_by(CopilotSession.last_active_at.desc())
            .all()
        )
        return [
            {
                "session_id": s.uuid,
                "persona_id": s.persona_id,
                "created_at": s.created_at.isoformat(),
                "last_active_at": s.last_active_at.isoformat(),
                "message_count": len(s.messages),
            }
            for s in sessions
        ]

    def get_messages(self, session_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Returns all messages for a session (validates ownership)."""
        session = self.db.query(CopilotSession).filter(
            CopilotSession.uuid == session_id,
            CopilotSession.user_id == user_id
        ).first()
        if not session:
            return []
        return [
            {
                "id": m.uuid,
                "role": m.role,
                "content": m.content,
                "evidence": json.loads(m.evidence_json) if m.evidence_json else [],
                "tool_calls": json.loads(m.tool_calls_json) if m.tool_calls_json else [],
                "execution_time_ms": m.execution_time_ms,
                "created_at": m.created_at.isoformat(),
            }
            for m in session.messages
        ]
