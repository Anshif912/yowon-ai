import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from database import Team, TeamMember, TeamInvitation, AuditLog, User, Project
from modules.teams.repository import TeamRepository
from modules.teams.schemas import TeamCreate, TeamInvitationCreate, TeamDashboardResponse, TeamActivityItem
from core.middleware.correlation import correlation_id_ctx

class TeamService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = TeamRepository(db)

    def _generate_slug(self, name: str) -> str:
        base_slug = "".join(c if c.isalnum() else "-" for c in name.lower()).strip("-")
        base_slug = "-".join(filter(None, base_slug.split("-")))
        slug = base_slug
        counter = 1
        while self.repo.get_by_slug(slug) is not None:
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug

    def _audit(self, actor_id: str, event_type: str, target: str, prev: Optional[str] = None, new: Optional[str] = None):
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

    def create_team(self, workspace_id: str, payload: TeamCreate, creator_uuid: str) -> Team:
        slug = self._generate_slug(payload.name)
        team = Team(
            uuid=str(uuid.uuid4()),
            workspace_id=workspace_id,
            name=payload.name,
            description=payload.description,
            slug=slug,
            team_type=payload.team_type.upper(),
            status="ACTIVE",
            created_by=creator_uuid,
            created_at=datetime.utcnow()
        )
        self.repo.create(team)
        self.repo.save()

        # Add creator as Team Owner
        member = TeamMember(
            uuid=str(uuid.uuid4()),
            team_id=team.uuid,
            user_id=creator_uuid,
            role="Team Owner",
            joined_at=datetime.utcnow(),
            invitation_source="CODE",
            status="ACCEPTED"
        )
        self.db.add(member)

        self._audit(creator_uuid, "CREATE_TEAM", team.uuid, None, f'{{"name": "{team.name}", "slug": "{team.slug}"}}')
        self.db.commit()
        return team

    def get_team_by_id(self, team_id: str, user_uuid: str) -> Team:
        team = self.repo.get_by_id(team_id)
        if not team:
            raise HTTPException(status_code=404, detail="TEAM_NOT_FOUND")

        # Verify access: workspace membership is required
        # (rbac handles workspace permission check, but we verify here for containment safety)
        member = self.repo.get_member(team_id, user_uuid)
        if not member and team.created_by != user_uuid:
            # Check if user belongs to team's parent workspace
            from modules.workspaces.repository import WorkspaceRepository
            ws_repo = WorkspaceRepository(self.db)
            if not ws_repo.get_member(team.workspace_id, user_uuid):
                raise HTTPException(status_code=403, detail="ACCESS_FORBIDDEN_WORKSPACE_ISOLATION")

        return team

    def update_team(self, team_id: str, payload: TeamCreate, user_uuid: str) -> Team:
        team = self.get_team_by_id(team_id, user_uuid)
        member = self.repo.get_member(team_id, user_uuid)
        if not member or member.role not in ["Team Owner", "Team Lead"]:
            raise HTTPException(status_code=403, detail="ROLE_INSUFFICIENT_PERMISSIONS")

        prev_name = team.name
        team.name = payload.name
        team.description = payload.description
        team.team_type = payload.team_type.upper()
        
        self.repo.save()
        self._audit(user_uuid, "UPDATE_TEAM", team.uuid, f'{{"name": "{prev_name}"}}', f'{{"name": "{team.name}"}}')
        self.db.commit()
        return team

    def delete_team(self, team_id: str, user_uuid: str) -> None:
        team = self.get_team_by_id(team_id, user_uuid)
        member = self.repo.get_member(team_id, user_uuid)
        if not member or member.role != "Team Owner":
            raise HTTPException(status_code=403, detail="ROLE_INSUFFICIENT_PERMISSIONS")

        team.deleted_at = datetime.utcnow()
        self.repo.save()
        self._audit(user_uuid, "DELETE_TEAM", team.uuid)
        self.db.commit()

    def invite_member(self, team_id: str, payload: TeamInvitationCreate, inviter_uuid: str) -> TeamInvitation:
        team = self.get_team_by_id(team_id, inviter_uuid)
        member = self.repo.get_member(team_id, inviter_uuid)
        if not member or member.role not in ["Team Owner", "Team Lead"]:
            raise HTTPException(status_code=403, detail="ROLE_INSUFFICIENT_PERMISSIONS")

        code = f"TINV-{uuid.uuid4().hex[:8].upper()}"
        invitation = TeamInvitation(
            uuid=str(uuid.uuid4()),
            team_id=team_id,
            email=payload.email,
            username=payload.username,
            invite_code=code,
            role=payload.role,
            invited_by=inviter_uuid,
            status="PENDING",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        self.db.add(invitation)
        self.db.flush()

        self._audit(inviter_uuid, "INVITE_MEMBER", team_id, None, f'{{"email": "{payload.email}", "role": "{payload.role}"}}')
        self.db.commit()
        return invitation

    def join_team(self, code: str, user_uuid: str) -> TeamMember:
        invitation = self.repo.get_invitation_by_code(code)
        if not invitation or invitation.status != "PENDING":
            raise HTTPException(status_code=404, detail="INVITATION_NOT_FOUND")

        if invitation.expires_at < datetime.utcnow():
            invitation.status = "EXPIRED"
            self.db.commit()
            raise HTTPException(status_code=400, detail="INVITATION_EXPIRED")

        # Create member record
        member = TeamMember(
            uuid=str(uuid.uuid4()),
            team_id=invitation.team_id,
            user_id=user_uuid,
            role=invitation.role,
            joined_at=datetime.utcnow(),
            invitation_source="CODE",
            status="ACCEPTED"
        )
        self.db.add(member)
        invitation.status = "ACCEPTED"
        self.db.flush()

        self._audit(user_uuid, "JOIN_TEAM", invitation.team_id)
        self.db.commit()
        return member

    def leave_team(self, team_id: str, user_uuid: str) -> None:
        member = self.repo.get_member(team_id, user_uuid)
        if not member:
            raise HTTPException(status_code=404, detail="MEMBER_NOT_FOUND")

        if member.role == "Team Owner":
            raise HTTPException(status_code=400, detail="OWNER_CANNOT_LEAVE_WITHOUT_TRANSFER")

        member.status = "REMOVED"
        self.db.flush()
        self._audit(user_uuid, "LEAVE_TEAM", team_id)
        self.db.commit()

    def get_dashboard(self, team_id: str, user_uuid: str) -> TeamDashboardResponse:
        team = self.get_team_by_id(team_id, user_uuid)
        
        # Calculate statistics
        members_count = self.db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.status == "ACCEPTED"
        ).count()

        projects_count = self.db.query(Project).filter(
            Project.team_id == team_id,
            Project.deleted_at.is_(None)
        ).count()

        invitations_count = self.db.query(TeamInvitation).filter(
            TeamInvitation.team_id == team_id,
            TeamInvitation.status == "PENDING"
        ).count()

        # Query recent audit logs for activity list
        audits = self.db.query(AuditLog).filter(
            AuditLog.target_entity == team_id
        ).order_by(AuditLog.timestamp.desc()).limit(10).all()

        activity = []
        for a in audits:
            actor = self.db.query(User).filter(User.uuid == a.actor_id).first()
            actor_name = actor.full_name if actor else "System"
            activity.append(TeamActivityItem(
                event_type=a.event_type,
                actor_name=actor_name,
                details=a.new_values,
                timestamp=a.timestamp
            ))

        return TeamDashboardResponse(
            team=team,
            members_count=members_count,
            projects_count=projects_count,
            invitations_count=invitations_count,
            recent_activity=activity
        )
