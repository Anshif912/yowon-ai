"""
repositories/organization_dao.py — Organization & Team Data Access Object (DAO)

Encapsulates all database persistence operations for Organizations, Teams,
Memberships, and Centralized RBAC Scopes.
"""

import uuid
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from database import GitOrganization, Team, TeamMember, WorkspaceMember, User

logger = logging.getLogger("yowon.organization.dao")


class OrganizationDAO:
    """Encapsulates SQL / ORM operations for Organizations and Teams."""

    def __init__(self, db: Session):
        self.db = db

    def get_organization(self, org_id: str) -> Optional[GitOrganization]:
        """Retrieves a GitOrganization by UUID or slug."""
        return self.db.query(GitOrganization).filter(
            (GitOrganization.uuid == org_id) | (GitOrganization.login == org_id)
        ).first()

    def list_organizations(self, workspace_id: Optional[str] = None) -> List[GitOrganization]:
        """Lists organizations for workspace context."""
        query = self.db.query(GitOrganization)
        if workspace_id:
            query = query.filter(GitOrganization.workspace_id == workspace_id)
        return query.order_by(GitOrganization.created_at.desc()).all()

    def create_organization(
        self,
        name: str,
        login: str,
        workspace_id: str = "default-ws",
        provider_type: str = "github"
    ) -> GitOrganization:
        """Creates a new GitOrganization record."""
        org = GitOrganization(
            uuid=str(uuid.uuid4()),
            workspace_id=workspace_id,
            provider_type=provider_type,
            name=name,
            login=login,
            created_at=datetime.utcnow()
        )
        self.db.add(org)
        self.db.commit()
        self.db.refresh(org)
        return org

    def list_teams(self, workspace_id: Optional[str] = None) -> List[Team]:
        """Lists Teams for workspace context."""
        query = self.db.query(Team)
        if workspace_id:
            query = query.filter(Team.workspace_id == workspace_id)
        return query.order_by(Team.created_at.desc()).all()

    def create_team(
        self,
        name: str,
        slug: str,
        workspace_id: str = "default-ws",
        description: Optional[str] = None
    ) -> Team:
        """Creates a new Team record."""
        team = Team(
            uuid=str(uuid.uuid4()),
            workspace_id=workspace_id,
            name=name,
            slug=slug,
            description=description,
            created_at=datetime.utcnow()
        )
        self.db.add(team)
        self.db.commit()
        self.db.refresh(team)
        return team
