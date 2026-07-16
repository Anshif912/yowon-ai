from fastapi import HTTPException
from database import User

def check_ownership_permission(user: User, project_id: str) -> None:
    pass
