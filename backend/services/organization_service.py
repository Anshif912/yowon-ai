"""
services/organization_service.py — OrganizationService v1 & Centralized RBAC AuthZ Service

Encapsulates all domain business logic for Organizations, Teams, Member Invitations,
and Centralized Permission Scoping (Workspace -> Organization -> Repository -> Resource Policy).
"""

import logging
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from repositories.organization_dao import OrganizationDAO

logger = logging.getLogger("yowon.services.organization")


class CentralizedAuthZService:
    """Centralized Permission Resolver & Scope Verification Engine."""

    ROLE_HIERARCHY = {
        "SUPER_ADMIN": 100,
        "ORG_OWNER": 90,
        "WORKSPACE_ADMIN": 80,
        "REVIEWER": 50,
        "DEVELOPER": 30,
        "TEAM_MEMBER": 30,
        "GUEST": 10
    }

    def verify_permission(
        self,
        user_role: str,
        required_role: str = "DEVELOPER",
        workspace_id: Optional[str] = None
    ) -> bool:
        """Verifies if user role satisfies hierarchical authorization requirements."""
        user_power = self.ROLE_HIERARCHY.get(user_role.upper(), 10)
        req_power = self.ROLE_HIERARCHY.get(required_role.upper(), 30)
        return user_power >= req_power


class OrganizationService:
    """Versioned Domain Service v1 for Organization & Team Management."""

    def __init__(self, db: Session):
        self.db = db
        self.dao = OrganizationDAO(db)
        self.authz = CentralizedAuthZService()

    def list_organizations(self, workspace_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists organizations for active workspace context."""
        orgs = self.dao.list_organizations(workspace_id=workspace_id)
        return [
            {
                "uuid": o.uuid,
                "name": o.name,
                "login": o.login,
                "provider_type": o.provider_type,
                "created_at": o.created_at.isoformat() if o.created_at else None
            }
            for o in orgs
        ]

    def create_organization(
        self,
        name: str,
        slug: str,
        workspace_id: str = "default-ws"
    ) -> Dict[str, Any]:
        """Creates a new organization entity."""
        org = self.dao.create_organization(name=name, login=slug, workspace_id=workspace_id)
        return {
            "uuid": org.uuid,
            "name": org.name,
            "login": org.login,
            "status": "ACTIVE"
        }

    def list_teams(self, workspace_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Lists teams for active workspace context."""
        teams = self.dao.list_teams(workspace_id=workspace_id)
        return [
            {
                "uuid": t.uuid,
                "name": t.name,
                "slug": t.slug,
                "description": t.description,
                "created_at": t.created_at.isoformat() if t.created_at else None
            }
            for t in teams
        ]

    def create_team(
        self,
        name: str,
        slug: str,
        workspace_id: str = "default-ws",
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """Creates a new team entity."""
        team = self.dao.create_team(name=name, slug=slug, workspace_id=workspace_id, description=description)
        return {
            "uuid": team.uuid,
            "name": team.name,
            "slug": team.slug,
            "description": team.description
        }
