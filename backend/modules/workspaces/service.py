import uuid
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from database import Workspace, WorkspaceMember, WorkspaceInvitation, AuditLog, User
from modules.workspaces.repository import WorkspaceRepository
from modules.workspaces.schemas import WorkspaceCreate, WorkspaceInvitationCreate
from modules.workspaces.exceptions import (
    WorkspaceNotFoundException,
    UnauthorizedWorkspaceActionException,
    WorkspaceArchivedException,
    PersonalWorkspaceDeletionException,
)

logger = logging.getLogger("yowon.workspaces.service")

class WorkspaceService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = WorkspaceRepository(db)

    def create_workspace(self, payload: WorkspaceCreate, owner_uuid: str) -> Workspace:
        ws = Workspace(
            workspace_id=str(uuid.uuid4()),
            organization_id=payload.organization_id,
            name=payload.name,
            description=payload.description,
            type=payload.type.upper(),
            visibility=payload.visibility.upper(),
            owner_id=owner_uuid,
            preferences='{"evaluation_profile": "standard", "allowed_sources": ["*"], "leaderboard_visibility": "public"}',
            created_at=datetime.utcnow()
        )
        self.repo.create(ws)

        # Create workspace membership record for owner
        member = WorkspaceMember(
            id=str(uuid.uuid4()),
            workspace_id=ws.workspace_id,
            user_id=owner_uuid,
            role="WORKSPACE_ADMIN",
            status="ACCEPTED",
            joined_at=datetime.utcnow()
        )
        self.db.add(member)

        # Audit logging
        audit = AuditLog(
            actor_id=owner_uuid,
            event_type="CREATE_WORKSPACE",
            target_entity=ws.workspace_id,
            previous_values=None,
            new_values=f'{{"name": "{ws.name}", "type": "{ws.type}"}}',
            correlation_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)
        self.db.commit()

        return ws

    def get_workspace_by_id(self, workspace_id: str, user_uuid: str) -> Workspace:
        ws = self.repo.get_active_by_id(workspace_id)
        if not ws:
            raise WorkspaceNotFoundException()

        # Enforce membership check
        member = self.repo.get_member(workspace_id, user_uuid)
        if not member and ws.owner_id != user_uuid:
            raise UnauthorizedWorkspaceActionException()

        return ws

    def update_workspace(self, workspace_id: str, payload: WorkspaceCreate, user_uuid: str) -> Workspace:
        ws = self.repo.get_active_by_id(workspace_id)
        if not ws:
            raise WorkspaceNotFoundException()

        # Check permissions: owner or workspace admin
        member = self.repo.get_member(workspace_id, user_uuid)
        if ws.owner_id != user_uuid and (not member or member.role != "WORKSPACE_ADMIN"):
            raise UnauthorizedWorkspaceActionException()

        # Enforce PERSONAL workspace protections
        if ws.type == "PERSONAL":
            if payload.type.upper() != "PERSONAL":
                raise HTTPException(status_code=400, detail="CANNOT_CHANGE_PERSONAL_WORKSPACE_TYPE")
            if payload.description and "[ARCHIVED]" in payload.description:
                raise HTTPException(status_code=400, detail="CANNOT_ARCHIVE_PERSONAL_WORKSPACE")

        ws.name = payload.name
        ws.description = payload.description
        if ws.type != "PERSONAL":
            ws.type = payload.type.upper()
        ws.visibility = payload.visibility.upper()
        if payload.organization_id and ws.type != "PERSONAL":
            ws.organization_id = payload.organization_id

        self.repo.save()

        # Audit logging
        audit = AuditLog(
            actor_id=user_uuid,
            event_type="UPDATE_WORKSPACE",
            target_entity=ws.workspace_id,
            previous_values=None,
            new_values=f'{{"name": "{payload.name}", "type": "{payload.type}"}}',
            correlation_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)
        self.db.commit()

        return ws

    def delete_workspace(self, workspace_id: str, user_uuid: str) -> None:
        ws = self.repo.get_active_by_id(workspace_id)
        if not ws:
            raise WorkspaceNotFoundException()

        # Prevent PERSONAL workspace deletion
        if ws.type == "PERSONAL":
            raise PersonalWorkspaceDeletionException()

        # Check permissions: only owner can delete workspace
        if ws.owner_id != user_uuid:
            raise UnauthorizedWorkspaceActionException()

        # Soft delete
        ws.deleted_at = datetime.utcnow()
        ws.deleted_by = user_uuid
        self.repo.save()

        # Audit logging
        audit = AuditLog(
            actor_id=user_uuid,
            event_type="DELETE_WORKSPACE",
            target_entity=ws.workspace_id,
            correlation_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)
        self.db.commit()

    def list_user_workspaces(self, user_uuid: str) -> List[Workspace]:
        return self.repo.list_for_user(user_uuid)

    # ── Workspace Resolver Service ───────────────────────────────────────────
    def resolve_workspace(self, workspace_id: str, user_uuid: str) -> Workspace:
        """Single entry point verifying membership, active status and loading caching context."""
        ws = self.repo.get_active_by_id(workspace_id)
        if not ws or ws.deleted_at is not None:
            raise WorkspaceNotFoundException()

        # Check if user is member
        member = self.repo.get_member(workspace_id, user_uuid)
        if not member and ws.owner_id != user_uuid:
            # Check if public workspace
            if ws.visibility == "PUBLIC":
                # Automatically add guest membership
                member = WorkspaceMember(
                    id=str(uuid.uuid4()),
                    workspace_id=workspace_id,
                    user_id=user_uuid,
                    role="GUEST",
                    status="ACCEPTED",
                    joined_at=datetime.utcnow()
                )
                self.db.add(member)
                self.db.commit()
            else:
                raise UnauthorizedWorkspaceActionException()

        # Validate membership status (pending/suspended checks)
        if member and member.status != "ACCEPTED":
            raise HTTPException(
                status_code=403,
                detail=f"WORKSPACE_MEMBERSHIP_{member.status.upper()}"
            )

        # Check status (e.g. archived/suspended)
        if ws.description and "[ARCHIVED]" in ws.description:
            raise WorkspaceArchivedException()
        if ws.visibility == "SUSPENDED":
            raise HTTPException(status_code=403, detail="WORKSPACE_IS_SUSPENDED")

        # Log audit event context change
        audit = AuditLog(
            actor_id=user_uuid,
            event_type="RESOLVE_WORKSPACE",
            target_entity=workspace_id,
            correlation_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)
        self.db.commit()

        return ws

    # ── Invitation System ─────────────────────────────────────────────────────
    def create_invitation(
        self, workspace_id: str, payload: WorkspaceInvitationCreate, creator_uuid: str
    ) -> WorkspaceInvitation:
        ws = self.repo.get_active_by_id(workspace_id)
        if not ws:
            raise WorkspaceNotFoundException()

        # Check permissions: owner or workspace admin
        member = self.repo.get_member(workspace_id, creator_uuid)
        if ws.owner_id != creator_uuid and (not member or member.role != "WORKSPACE_ADMIN"):
            raise UnauthorizedWorkspaceActionException()

        invite_code = f"INV-{uuid.uuid4().hex[:8].upper()}"
        invitation = WorkspaceInvitation(
            uuid=str(uuid.uuid4()),
            workspace_id=workspace_id,
            email=payload.email,
            username=payload.username,
            invite_code=invite_code,
            role=payload.role,
            invited_by=creator_uuid,
            status="PENDING",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        self.db.add(invitation)

        # Audit logging
        audit = AuditLog(
            actor_id=creator_uuid,
            event_type="INVITE_MEMBER",
            target_entity=workspace_id,
            previous_values=None,
            new_values=f'{{"email": "{payload.email}", "code": "{invite_code}"}}',
            correlation_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)
        self.db.commit()

        return invitation

    def accept_invitation(self, invite_code: str, user_uuid: str) -> WorkspaceMember:
        invitation = self.repo.get_invitation_by_code(invite_code)
        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation not found or expired")

        if invitation.expires_at < datetime.utcnow():
            invitation.status = "EXPIRED"
            self.db.commit()
            raise HTTPException(status_code=400, detail="Invitation code has expired")

        # Create/Update Workspace membership
        existing_member = self.repo.get_member(invitation.workspace_id, user_uuid)
        if existing_member:
            existing_member.status = "ACCEPTED"
            existing_member.role = invitation.role
            member = existing_member
        else:
            member = WorkspaceMember(
                id=str(uuid.uuid4()),
                workspace_id=invitation.workspace_id,
                user_id=user_uuid,
                role=invitation.role,
                status="ACCEPTED",
                joined_at=datetime.utcnow()
            )
            self.db.add(member)

        invitation.status = "ACCEPTED"
        self.db.commit()

        # Audit logging
        audit = AuditLog(
            actor_id=user_uuid,
            event_type="JOIN_WORKSPACE",
            target_entity=invitation.workspace_id,
            correlation_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow()
        )
        self.db.add(audit)
        self.db.commit()

        return member

    def reject_invitation(self, invite_code: str, user_uuid: str) -> None:
        invitation = self.repo.get_invitation_by_code(invite_code)
        if not invitation:
            raise HTTPException(status_code=404, detail="Invitation not found")

        invitation.status = "REJECTED"
        self.db.commit()

    def list_invitations(self, workspace_id: str, user_uuid: str) -> List[WorkspaceInvitation]:
        ws = self.repo.get_active_by_id(workspace_id)
        if not ws:
            raise WorkspaceNotFoundException()
        return self.db.query(WorkspaceInvitation).filter(
            WorkspaceInvitation.workspace_id == workspace_id
        ).all()
