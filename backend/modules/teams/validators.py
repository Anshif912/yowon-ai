import re
from fastapi import HTTPException

ALLOWED_TEAM_TYPES = {"DEVELOPMENT", "RESEARCH", "STARTUP", "COLLEGE", "COMPANY", "OPEN_SOURCE"}

def validate_team_slug(slug: str) -> None:
    if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", slug):
        raise HTTPException(status_code=400, detail="INVALID_SLUG_FORMAT")

def validate_team_type(team_type: str) -> None:
    if team_type.upper() not in ALLOWED_TEAM_TYPES:
        raise HTTPException(status_code=400, detail="INVALID_TEAM_TYPE")
