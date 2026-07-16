from typing import List, Optional
from sqlalchemy.orm import Session
from database import Project, ProjectVersion, ProjectAttachment, ProjectComment

class ProjectRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = Project

    def create(self, project: Project) -> Project:
        self.db.add(project)
        return project

    def save(self) -> None:
        self.db.flush()

    def get_by_id(self, project_id: str) -> Optional[Project]:
        return self.db.query(Project).filter(
            Project.id == project_id,
            Project.deleted_at.is_(None)
        ).first()

    def get_by_slug(self, slug: str) -> Optional[Project]:
        return self.db.query(Project).filter(
            Project.slug == slug,
            Project.deleted_at.is_(None)
        ).first()

    def list_by_workspace(self, workspace_id: str) -> List[Project]:
        return self.db.query(Project).filter(
            Project.workspace_id == workspace_id,
            Project.deleted_at.is_(None)
        ).all()

    def list_versions(self, project_id: str) -> List[ProjectVersion]:
        return self.db.query(ProjectVersion).filter(
            ProjectVersion.project_id == project_id
        ).order_by(ProjectVersion.created_at.desc()).all()

    def list_attachments(self, project_id: str) -> List[ProjectAttachment]:
        return self.db.query(ProjectAttachment).filter(
            ProjectAttachment.project_id == project_id
        ).all()

    def list_comments(self, project_id: str) -> List[ProjectComment]:
        # Return only top-level comments; SQLAlchemy relationship can handle replies
        return self.db.query(ProjectComment).filter(
            ProjectComment.project_id == project_id,
            ProjectComment.parent_id.is_(None)
        ).order_by(ProjectComment.created_at.desc()).all()
