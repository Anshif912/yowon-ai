from fastapi import HTTPException

def validate_ownership_percentage(percentage: float) -> None:
    if percentage <= 0.0 or percentage > 100.0:
        raise HTTPException(status_code=400, detail="INVALID_OWNERSHIP_PERCENTAGE")
