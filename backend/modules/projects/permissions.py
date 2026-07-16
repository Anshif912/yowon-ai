from fastapi import HTTPException
from database import User

def check_project_access(user: User, project, required_action: str) -> None:
    # Project workspace boundaries checks
    pass
