from sqlalchemy.orm import Session
from typing import List, Optional
from core.common.base import BaseRepository
from database import Workspace, WorkspaceMember, WorkspaceInvitation

class WorkspaceRepository(BaseRepository[Workspace]):
    def __init__(self, db: Session):
        super().__init__(db, Workspace)

    def get_active_by_id(self, workspace_id: str) -> Optional[Workspace]:
        return self.db.query(Workspace).filter(
            Workspace.workspace_id == workspace_id,
            Workspace.deleted_at.is_(None)
        ).first()

    def list_for_user(self, user_uuid: str) -> List[Workspace]:
        # Get workspaces where user is owner or member
        owned = self.db.query(Workspace).filter(
            Workspace.owner_id == user_uuid,
            Workspace.deleted_at.is_(None)
        ).all()
        
        member_ws_ids = self.db.query(WorkspaceMember.workspace_id).filter(
            WorkspaceMember.user_id == user_uuid,
            WorkspaceMember.status == "ACCEPTED"
        )
        
        member_of = self.db.query(Workspace).filter(
            Workspace.workspace_id.in_(member_ws_ids),
            Workspace.deleted_at.is_(None)
        ).all()
        
        combined = {ws.workspace_id: ws for ws in (owned + member_of)}
        return list(combined.values())

    def list_by_organization(self, org_uuid: str) -> List[Workspace]:
        return self.db.query(Workspace).filter(
            Workspace.organization_id == org_uuid,
            Workspace.deleted_at.is_(None)
        ).all()

    def get_member(self, workspace_id: str, user_uuid: str) -> Optional[WorkspaceMember]:
        return self.db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_uuid
        ).first()

    def get_members(self, workspace_id: str) -> List[WorkspaceMember]:
        return self.db.query(WorkspaceMember).filter(
            WorkspaceMember.workspace_id == workspace_id
        ).all()

    def get_invitation_by_code(self, code: str) -> Optional[WorkspaceInvitation]:
        return self.db.query(WorkspaceInvitation).filter(
            WorkspaceInvitation.invite_code == code,
            WorkspaceInvitation.status == "PENDING"
        ).first()
