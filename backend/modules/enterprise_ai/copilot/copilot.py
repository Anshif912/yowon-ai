import uuid
import time
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from database import AuditLog
from modules.enterprise_ai.orchestrator.coordinator import AICoordinator
from modules.enterprise_ai.context.builder import ContextBuilder
from modules.enterprise_ai.tools.registry import tool_registry
# Import implementations to ensure registration happens on package load
import modules.enterprise_ai.tools.implementations

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
        raw_documents: List[Dict[str, Any]],
        context_overrides: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Runs the complete Copilot pipeline: Context Assembly, Planning, Execution and Auditing."""
        # 1. Assemble context via Builder
        assembled_context = self.context_builder.build_context(
            query=query,
            workspace_id=workspace_id,
            user_role=user_role,
            raw_documents=raw_documents
        )

        # Merge additional context metrics
        full_context = {
            **context_overrides,
            "assembled_context": assembled_context
        }

        # 2. Coordinate execution run
        start_time = time.perf_counter()
        result = await self.coordinator.coordinate_execution(query, full_context)
        execution_time_ms = int((time.perf_counter() - start_time) * 1000)

        # 3. Log Copilot Tool Invocation History
        for execution in result["executions"]:
            audit = AuditLog(
                actor_id=user_uuid,
                event_type="COPILOT_TOOL_INVOCATION",
                target_entity=execution["tool"],
                correlation_id=session_id,
                timestamp=datetime.utcnow()
            )
            # Log rich parameters for diagnostics
            audit.llm_error = f"Execution status: {execution['status']}"
            audit.subsystem_health_json = str({
                "uuid": str(uuid.uuid4()),
                "session_id": session_id,
                "tool_name": execution["tool"],
                "arguments": {"query": query},
                "execution_time_ms": execution_time_ms,
                "status": execution["status"],
                "result_summary": execution.get("output", {}).get("summary", "No summary output."),
                "created_at": datetime.utcnow().isoformat()
            })
            self.db.add(audit)

        self.db.commit()
        return {
            "session_id": session_id,
            "query": query,
            "context_summary": {
                "documents_included": len(assembled_context["documents"]),
                "tokens_used": assembled_context["tokens_used"]
            },
            "orchestration": result,
            "execution_time_ms": execution_time_ms
        }
