"""
repositories/repository_dao.py — Repository Data Access Object (DAO)

Encapsulates all persistent database operations for repositories, snapshots,
files, and evaluation histories, decoupling database logic from business services.
"""

import uuid
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from database import (
    GitRepository,
    Project,
    RepositorySnapshot,
    RepositoryFile,
    RepositoryAnalysis,
    Evaluation,
    RepositorySync
)

logger = logging.getLogger("yowon.repositories.dao")


class RepositoryDAO:
    """Encapsulates SQL / ORM operations for repositories and evaluation persistence."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, repo_id: str) -> Optional[GitRepository]:
        """Retrieves a GitRepository by UUID."""
        return self.db.query(GitRepository).filter(GitRepository.uuid == repo_id).first()

    def get_by_full_name(self, full_name: str) -> Optional[GitRepository]:
        """Retrieves a GitRepository by owner/repo full name."""
        return self.db.query(GitRepository).filter(GitRepository.full_name == full_name).first()

    def list_all(
        self,
        workspace_id: Optional[str] = None,
        language: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 100
    ) -> List[GitRepository]:
        """Lists repositories with optional workspace, language, and search filters."""
        query = self.db.query(GitRepository)
        if workspace_id:
            query = query.filter(GitRepository.workspace_id == workspace_id)
        if language:
            query = query.filter(GitRepository.language.ilike(f"%{language}%"))
        if search:
            query = query.filter(
                (GitRepository.name.ilike(f"%{search}%")) |
                (GitRepository.full_name.ilike(f"%{search}%")) |
                (GitRepository.description.ilike(f"%{search}%"))
            )
        return query.order_by(GitRepository.updated_at.desc()).limit(limit).all()

    def create_or_update(self, repo_data: Dict[str, Any]) -> GitRepository:
        """Upserts a GitRepository record."""
        full_name = repo_data.get("full_name") or f"{repo_data.get('owner', 'user')}/{repo_data['name']}"
        existing = self.get_by_full_name(full_name)

        if existing:
            for key, val in repo_data.items():
                if hasattr(existing, key) and val is not None:
                    setattr(existing, key, val)
            existing.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(existing)
            return existing

        new_repo = GitRepository(
            uuid=repo_data.get("uuid") or str(uuid.uuid4()),
            workspace_id=repo_data.get("workspace_id", "default-ws"),
            name=repo_data["name"],
            full_name=full_name,
            description=repo_data.get("description"),
            html_url=repo_data.get("html_url", f"https://github.com/{full_name}"),
            private=repo_data.get("private", False),
            language=repo_data.get("language", "TypeScript"),
            stars_count=repo_data.get("stars_count", 0),
            default_branch=repo_data.get("default_branch", "main"),
            last_sync_at=datetime.utcnow()
        )
        self.db.add(new_repo)
        self.db.commit()
        self.db.refresh(new_repo)
        return new_repo

    def get_latest_snapshot(self, repo_id: str) -> Optional[RepositorySnapshot]:
        """Retrieves the latest repository snapshot for a repository."""
        return self.db.query(RepositorySnapshot).filter(
            RepositorySnapshot.repository_id == repo_id
        ).order_by(RepositorySnapshot.snapshot_timestamp.desc()).first()

    def create_snapshot(
        self,
        repo_id: str,
        commit_sha: str,
        branch: str = "main",
        tree_hash: Optional[str] = None
    ) -> RepositorySnapshot:
        """Creates a new RepositorySnapshot entry."""
        snapshot = RepositorySnapshot(
            snapshot_id=str(uuid.uuid4()),
            repository_id=repo_id,
            commit_sha=commit_sha,
            branch_name=branch,
            tree_hash=tree_hash or commit_sha[:12],
            snapshot_timestamp=datetime.utcnow()
        )
        self.db.add(snapshot)
        self.db.commit()
        self.db.refresh(snapshot)
        return snapshot

    def get_analysis_by_sha(self, commit_sha: str) -> Optional[RepositoryAnalysis]:
        """Retrieves RepositoryAnalysis record by commit sha or snapshot id."""
        return self.db.query(RepositoryAnalysis).filter(
            (RepositoryAnalysis.commit_sha == commit_sha) |
            (RepositoryAnalysis.repository_snapshot_id == commit_sha)
        ).first()

    def record_sync_log(
        self,
        repo_id: str,
        status: str = "SUCCESS",
        files_synced: int = 0,
        commit_sha: Optional[str] = None
    ) -> RepositorySync:
        """Records a RepositorySync audit log entry."""
        sync_log = RepositorySync(
            sync_id=str(uuid.uuid4()),
            repository_id=repo_id,
            sync_type="FETCH",
            status=status,
            files_changed=files_synced,
            commit_sha=commit_sha,
            timestamp=datetime.utcnow()
        )
        self.db.add(sync_log)
        self.db.commit()
        return sync_log
