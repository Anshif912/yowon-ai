import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session

import uuid
from datetime import datetime
from database import get_db, User, AuditLog
from modules.identity.schemas import (
    UserResponse,
    ProfileUpdate,
    PasswordChange,
)
from auth.security import get_current_user, hash_password, verify_password

logger = logging.getLogger("yowon.identity.router")
router = APIRouter(prefix="/auth", tags=["Identity"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns profile details of the current authenticated user."""
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(payload: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Updates profile attributes for current user."""
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    if payload.preferences is not None:
        current_user.preferences = payload.preferences
    if payload.timezone is not None:
        current_user.timezone = payload.timezone
    if payload.language is not None:
        current_user.language = payload.language
        
    db.commit()
    db.refresh(current_user)

    # Log profile update audit log
    audit = AuditLog(
        actor_id=current_user.uuid,
        event_type="PROFILE_UPDATE",
        target_entity=current_user.uuid,
        correlation_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    return current_user

@router.put("/change-password")
def change_password(payload: PasswordChange, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Changes password for the authenticated user."""
    if not verify_password(payload.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed."
        )

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()

    # Log password change audit log
    audit = AuditLog(
        actor_id=current_user.uuid,
        event_type="PASSWORD_CHANGE",
        target_entity=current_user.uuid,
        correlation_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

    logger.info(f"User changed password: {current_user.email}")
    return {"success": True, "detail": "Password successfully updated."}
