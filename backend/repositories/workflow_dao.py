"""
repositories/workflow_dao.py — Workflow Automation Data Access Object (DAO)

Encapsulates database persistence operations for Workflow Pipelines,
node definitions, execution runs, and policy audit logs.
"""

import uuid
import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from database import WorkflowPipeline, WorkflowRun

logger = logging.getLogger("yowon.workflows.dao")


class WorkflowDAO:
    """Encapsulates SQL / ORM operations for Workflow Pipelines and Runs."""

    def __init__(self, db: Session):
        self.db = db

    def get_pipeline(self, pipeline_id: str) -> Optional[WorkflowPipeline]:
        """Retrieves a WorkflowPipeline by UUID."""
        return self.db.query(WorkflowPipeline).filter(WorkflowPipeline.uuid == pipeline_id).first()

    def list_pipelines(self, workspace_id: Optional[str] = None) -> List[WorkflowPipeline]:
        """Lists workflow pipelines for workspace context."""
        query = self.db.query(WorkflowPipeline)
        if workspace_id:
            query = query.filter(WorkflowPipeline.workspace_id == workspace_id)
        return query.order_by(WorkflowPipeline.created_at.desc()).all()

    def create_pipeline(
        self,
        name: str,
        trigger_type: str = "REPOSITORY_EVALUATED",
        graph_definition: Optional[Dict[str, Any]] = None,
        workspace_id: str = "default-ws"
    ) -> WorkflowPipeline:
        """Creates a new WorkflowPipeline record."""
        pipe = WorkflowPipeline(
            uuid=str(uuid.uuid4()),
            workspace_id=workspace_id,
            name=name,
            trigger_type=trigger_type,
            graph_definition=json.dumps(graph_definition) if graph_definition else None,
            is_active=True,
            created_at=datetime.utcnow()
        )
        self.db.add(pipe)
        self.db.commit()
        self.db.refresh(pipe)
        return pipe

    def create_run(self, pipeline_id: str, trigger_event: str = "MANUAL") -> WorkflowRun:
        """Records a new WorkflowRun execution entry."""
        run = WorkflowRun(
            uuid=str(uuid.uuid4()),
            pipeline_id=pipeline_id,
            status="SUCCESS",
            trigger_event=trigger_event,
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow()
        )
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run
