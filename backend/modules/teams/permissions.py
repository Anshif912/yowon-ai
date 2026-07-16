from fastapi import HTTPException
from database import User, TeamMember

def check_team_permission(user: User, team_id: str, required_roles: list[str], db) -> None:
    member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user.uuid,
        TeamMember.status == "ACCEPTED"
    ).first()
    
    if not member and user.role != "admin":
        raise HTTPException(status_code=403, detail="ACCESS_FORBIDDEN_TEAM_ISOLATION")
        
    if member and required_roles and member.role not in required_roles:
        raise HTTPException(status_code=403, detail="ROLE_INSUFFICIENT_PERMISSIONS")
