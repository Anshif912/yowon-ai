from typing import List, Optional
from sqlalchemy.orm import Session
from database import Team, TeamMember, TeamInvitation

class TeamRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = Team

    def create(self, team: Team) -> Team:
        self.db.add(team)
        return team

    def save(self) -> None:
        self.db.flush()

    def get_by_id(self, team_uuid: str) -> Optional[Team]:
        return self.db.query(Team).filter(
            Team.uuid == team_uuid,
            Team.deleted_at.is_(None)
        ).first()

    def get_by_slug(self, slug: str) -> Optional[Team]:
        return self.db.query(Team).filter(
            Team.slug == slug,
            Team.deleted_at.is_(None)
        ).first()

    def list_by_workspace(self, workspace_id: str) -> List[Team]:
        return self.db.query(Team).filter(
            Team.workspace_id == workspace_id,
            Team.deleted_at.is_(None)
        ).all()

    def get_member(self, team_id: str, user_id: str) -> Optional[TeamMember]:
        return self.db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
            TeamMember.status == "ACCEPTED"
        ).first()

    def get_invitation_by_code(self, code: str) -> Optional[TeamInvitation]:
        return self.db.query(TeamInvitation).filter(
            TeamInvitation.invite_code == code
        ).first()
