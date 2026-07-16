from fastapi import HTTPException
import re

def validate_project_name(name: str) -> None:
    if len(name.strip()) < 3:
        raise HTTPException(status_code=400, detail="PROJECT_NAME_TOO_SHORT")

def validate_github_url(url: str) -> None:
    if url and not re.match(r"^https?://(?:www\.)?github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/?$", url):
        raise HTTPException(status_code=400, detail="INVALID_GITHUB_REPOSITORY_URL")
