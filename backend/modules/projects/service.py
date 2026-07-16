import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from database import (
    Project,
    ProjectVersion,
    ProjectMetadata,
    ProjectSource,
    ProjectAttachment,
    ProjectComment,
    OwnershipRecord,
    AuditLog,
    User,
    Evaluation
)
from modules.projects.repository import ProjectRepository
from modules.projects.schemas import (
    ProjectCreate,
    ProjectVersionCreate,
    ProjectAttachmentCreate,
    ProjectCommentCreate,
    ProjectImportCreate,
    ProjectSearchItem
)
from core.middleware.correlation import correlation_id_ctx

class ProjectService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = ProjectRepository(db)

    def _generate_slug(self, name: str) -> str:
        base_slug = "".join(c if c.isalnum() else "-" for c in name.lower()).strip("-")
        base_slug = "-".join(filter(None, base_slug.split("-")))
        slug = base_slug
        counter = 1
        while self.repo.get_by_slug(slug) is not None:
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug

    def _audit(self, actor_id: Optional[str], event_type: str, target: str, prev: Optional[str] = None, new: Optional[str] = None):
        corr_id = correlation_id_ctx.get() or str(uuid.uuid4())
        audit = AuditLog(
            actor_id=actor_id,
            event_type=event_type,
            target_entity=target,
            previous_values=prev,
            new_values=new,
            correlation_id=corr_id,
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)

    def create_project(self, workspace_id: str, payload: ProjectCreate, creator_uuid: str) -> Project:
        slug = self._generate_slug(payload.name)
        project = Project(
            id=str(uuid.uuid4()),
            workspace_id=workspace_id,
            team_id=payload.team_id,
            name=payload.name,
            slug=slug,
            project_type=payload.project_type,
            description=payload.description,
            github_url=payload.github_url,
            visibility=payload.visibility.upper(),
            tags=payload.tags,
            category=payload.category,
            current_version="0.1.0",
            status="REGISTERED",
            created_by=creator_uuid,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.repo.create(project)
        self.repo.save()

        # Add 100% initial ownership record for creator (Explicit Ownership Governance Requirement)
        owner_record = OwnershipRecord(
            uuid=str(uuid.uuid4()),
            project_id=project.id,
            owner_id=creator_uuid,
            ownership_type="Individual",
            ownership_percentage=100.0,
            verification_status="Verified",
            joined_date=datetime.utcnow(),
            source="REGISTRATION",
            notes="Initial project registrant"
        )
        self.db.add(owner_record)

        self._audit(creator_uuid, "CREATE_PROJECT", project.id, None, f'{{"name": "{project.name}", "slug": "{project.slug}"}}')
        self.db.commit()
        return project

    def get_project_by_id(self, project_id: str, user_uuid: str) -> Project:
        project = self.repo.get_by_id(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="PROJECT_NOT_FOUND")

        # Isolation border check: verify membership in workspace
        from modules.workspaces.repository import WorkspaceRepository
        ws_repo = WorkspaceRepository(self.db)
        if not ws_repo.get_member(project.workspace_id, user_uuid):
            raise HTTPException(status_code=403, detail="ACCESS_FORBIDDEN_WORKSPACE_ISOLATION")

        return project

    def update_project(self, project_id: str, payload: ProjectCreate, user_uuid: str) -> Project:
        project = self.get_project_by_id(project_id, user_uuid)
        
        project.name = payload.name
        project.description = payload.description
        project.project_type = payload.project_type
        project.github_url = payload.github_url
        project.team_id = payload.team_id
        project.visibility = payload.visibility.upper()
        project.tags = payload.tags
        project.category = payload.category
        project.updated_by = user_uuid
        project.updated_at = datetime.utcnow()

        self.repo.save()
        self._audit(user_uuid, "UPDATE_PROJECT", project.id)
        self.db.commit()
        return project

    def delete_project(self, project_id: str, user_uuid: str) -> None:
        project = self.get_project_by_id(project_id, user_uuid)
        project.deleted_at = datetime.utcnow()
        self.repo.save()
        self._audit(user_uuid, "DELETE_PROJECT", project.id)
        self.db.commit()

    def import_repository(self, project_id: str, payload: ProjectImportCreate, user_uuid: str) -> Project:
        project = self.get_project_by_id(project_id, user_uuid)
        
        # Connect repository connection status
        project.repository_url = payload.repository_url
        project.default_branch = payload.default_branch
        project.status = "DEVELOPMENT"

        # Populate Metadata connection details (Mock extraction parser metrics)
        metadata = self.db.query(ProjectMetadata).filter(ProjectMetadata.project_id == project_id).first()
        if not metadata:
            metadata = ProjectMetadata(
                uuid=str(uuid.uuid4()),
                project_id=project_id
            )
            self.db.add(metadata)

        metadata.languages = '{"TypeScript": 72.5, "Python": 20.0, "HTML": 5.0, "CSS": 2.5}'
        metadata.frameworks = '["React", "FastAPI", "TailwindCSS"]'
        metadata.ai_models = '["Gemini Pro", "Llama 3"]'
        metadata.deployment_targets = '["Vercel", "AWS ECS"]'
        metadata.database_systems = '["PostgreSQL", "Redis"]'
        metadata.cloud_providers = '["AWS", "Google Cloud"]'
        metadata.repository_size = 14820194  # 14 MB
        metadata.file_count = 142
        metadata.commit_count = 34
        metadata.contributors = 2
        metadata.webhook_enabled = True
        metadata.last_commit_message = "feat: integrate workspaces context middleware"
        metadata.last_sync_at = datetime.utcnow()
        metadata.extracted_at = datetime.utcnow()

        # Connect ProjectSource configuration
        source = self.db.query(ProjectSource).filter(ProjectSource.project_id == project_id).first()
        if not source:
            source = ProjectSource(
                uuid=str(uuid.uuid4()),
                project_id=project_id,
                source_type="GITHUB",
                connection_details=f'{{"repo_url": "{payload.repository_url}"}}',
                status="CONNECTED",
                last_sync_at=datetime.utcnow()
            )
            self.db.add(source)

        self.repo.save()
        self._audit(user_uuid, "IMPORT_REPOSITORY", project_id, None, f'{{"url": "{payload.repository_url}"}}')
        self.db.commit()
        return project

    def commit_version(self, project_id: str, payload: ProjectVersionCreate, user_uuid: str) -> ProjectVersion:
        project = self.get_project_by_id(project_id, user_uuid)
        
        version = ProjectVersion(
            uuid=str(uuid.uuid4()),
            project_id=project_id,
            version=payload.version,
            tag=payload.tag,
            branch=payload.branch,
            commit_sha=payload.commit_sha,
            readme_snapshot=payload.readme_snapshot,
            created_by=user_uuid,
            created_at=datetime.utcnow()
        )
        self.db.add(version)
        project.current_version = payload.version
        
        self.repo.save()
        self._audit(user_uuid, "RELEASE_VERSION", project_id, None, f'{{"version": "{payload.version}"}}')
        self.db.commit()
        return version

    def add_attachment(self, project_id: str, payload: ProjectAttachmentCreate, user_uuid: str) -> ProjectAttachment:
        project = self.get_project_by_id(project_id, user_uuid)
        
        attachment = ProjectAttachment(
            uuid=str(uuid.uuid4()),
            project_id=project_id,
            name=payload.name,
            file_path=payload.file_path,
            file_type=payload.file_type,
            uploaded_by=user_uuid,
            uploaded_at=datetime.utcnow()
        )
        self.db.add(attachment)
        self.db.flush()
        
        self._audit(user_uuid, "ADD_ATTACHMENT", project_id, None, f'{{"name": "{payload.name}"}}')
        self.db.commit()
        return attachment

    def add_comment(self, project_id: str, payload: ProjectCommentCreate, user_uuid: str) -> ProjectComment:
        project = self.get_project_by_id(project_id, user_uuid)
        
        comment = ProjectComment(
            uuid=str(uuid.uuid4()),
            project_id=project_id,
            user_id=user_uuid,
            parent_id=payload.parent_id,
            content=payload.content,
            is_pinned=False,
            is_resolved=False,
            created_at=datetime.utcnow()
        )
        self.db.add(comment)
        self.db.flush()
        
        self._audit(user_uuid, "ADD_COMMENT", project_id)
        self.db.commit()
        return comment

    def search_project_workspace(self, project_id: str, query: str, user_uuid: str) -> List[ProjectSearchItem]:
        project = self.get_project_by_id(project_id, user_uuid)
        results = []
        q = f"%{query}%"

        # 1. Search in project description
        if query.lower() in (project.description or "").lower() or query.lower() in project.name.lower():
            results.append(ProjectSearchItem(
                entity_type="project",
                entity_id=project.id,
                title=project.name,
                subtitle="Project Core Settings",
                snippet=project.description,
                url=f"/projects/{project.id}/settings"
            ))

        # 2. Search in comments
        matching_comments = self.db.query(ProjectComment).filter(
            ProjectComment.project_id == project_id,
            ProjectComment.content.like(q)
        ).all()
        for c in matching_comments:
            results.append(ProjectSearchItem(
                entity_type="comment",
                entity_id=c.uuid,
                title="Team Discussion Post",
                subtitle=f"Created on {c.created_at.strftime('%Y-%m-%d')}",
                snippet=c.content,
                url=f"/projects/{project_id}/discussions"
            ))

        # 3. Search in versions
        matching_versions = self.db.query(ProjectVersion).filter(
            ProjectVersion.project_id == project_id,
            ProjectVersion.version.like(q)
        ).all()
        for v in matching_versions:
            results.append(ProjectSearchItem(
                entity_type="version",
                entity_id=v.uuid,
                title=f"Release Version {v.version}",
                subtitle=f"SHA: {v.commit_sha or 'N/A'}",
                snippet=v.readme_snapshot,
                url=f"/projects/{project_id}/versions"
            ))

        # 4. Search in evaluations
        matching_evals = self.db.query(Evaluation).filter(
            Evaluation.project_id == project_id,
            Evaluation.verdict.like(q)
        ).all()
        for ev in matching_evals:
            results.append(ProjectSearchItem(
                entity_type="evaluation",
                entity_id=ev.evaluation_id,
                title="AI Evaluation Run Details",
                subtitle=f"Overall Score: {ev.overall_score or 0.0}",
                snippet=f"Verdict: {ev.verdict or 'Pending'} | Engine: {ev.analysis_engine_version}",
                url=f"/report/{ev.project_id}"
            ))

        return results
