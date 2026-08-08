import logging
from typing import Optional, Any, Dict
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


# ── Enterprise Identity Directory & User Lifecycles ──

from auth.security import RoleChecker

@router.get("/admin/users")
def list_users(
    db: Session = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin", "SUPER_ADMIN", "ORG_OWNER"]))
):
    """Retrieve all users in the enterprise directory."""
    users = db.query(User).all()
    return [{
        "uuid": u.uuid,
        "full_name": u.full_name,
        "email": u.email,
        "role": u.role,
        "status": u.status,
        "created_at": u.created_at,
        "failed_login_attempts": u.failed_login_attempts,
        "account_locked": u.account_locked
    } for u in users]


@router.post("/admin/users/{user_uuid}/suspend")
def suspend_user(
    user_uuid: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin", "SUPER_ADMIN", "ORG_OWNER"]))
):
    """Suspends a user account."""
    user = db.query(User).filter(User.uuid == user_uuid).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        
    user.status = "suspended"
    db.commit()
    
    # Log audit log
    audit = AuditLog(
        actor_id=admin_user.uuid,
        event_type="USER_SUSPENDED",
        target_entity=user.uuid,
        correlation_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    
    return {"success": True, "detail": f"User {user.email} suspended successfully."}


@router.post("/admin/users/{user_uuid}/unsuspend")
def unsuspend_user(
    user_uuid: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin", "SUPER_ADMIN", "ORG_OWNER"]))
):
    """Reactivates / unsuspends a user account."""
    user = db.query(User).filter(User.uuid == user_uuid).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        
    user.status = "active"
    db.commit()
    
    # Log audit log
    audit = AuditLog(
        actor_id=admin_user.uuid,
        event_type="USER_REACTIVATED",
        target_entity=user.uuid,
        correlation_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    
    return {"success": True, "detail": f"User {user.email} reactivated successfully."}


@router.post("/admin/users/{user_uuid}/archive")
def archive_user(
    user_uuid: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin", "SUPER_ADMIN", "ORG_OWNER"]))
):
    """Archives a user account. No hard delete to maintain audit logs."""
    user = db.query(User).filter(User.uuid == user_uuid).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        
    user.status = "archived"
    db.commit()
    
    # Log audit log
    audit = AuditLog(
        actor_id=admin_user.uuid,
        event_type="USER_ARCHIVED",
        target_entity=user.uuid,
        correlation_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    
    return {"success": True, "detail": f"User {user.email} archived successfully."}


from modules.identity.schemas import RoleUpdate, RolePermissionsUpdate

# Default system permissions matrix storage
SYSTEM_ROLE_MATRIX: dict[str, dict[str, Any]] = {
    "SUPER_ADMIN": {
        "role": "Platform Owner",
        "description": "Full administrative control over all organizations, infrastructure, and policies.",
        "level": "L5 - System",
        "permissions": {
            "repositories": True, "workflows": True, "secrets": True,
            "connectors": True, "policies": True, "marketplace": True, "administration": True
        }
    },
    "ORG_OWNER": {
        "role": "Organization Admin",
        "description": "Manages teams, members, connectors, and workspace policies.",
        "level": "L4 - Organization",
        "permissions": {
            "repositories": True, "workflows": True, "secrets": True,
            "connectors": True, "policies": True, "marketplace": True, "administration": False
        }
    },
    "WORKSPACE_ADMIN": {
        "role": "Security Engineer",
        "description": "Inspects vulnerability reports, updates policies, and rotates secret keys.",
        "level": "L3 - Security",
        "permissions": {
            "repositories": True, "workflows": True, "secrets": True,
            "connectors": False, "policies": True, "marketplace": False, "administration": False
        }
    },
    "TEAM_MEMBER": {
        "role": "Developer",
        "description": "Triggers evaluations, views repository intelligence, and executes queries.",
        "level": "L2 - Member",
        "permissions": {
            "repositories": True, "workflows": True, "secrets": False,
            "connectors": False, "policies": False, "marketplace": False, "administration": False
        }
    },
    "GUEST": {
        "role": "Viewer",
        "description": "Read-only access to executive dashboards and evaluation verdicts.",
        "level": "L1 - Read Only",
        "permissions": {
            "repositories": True, "workflows": False, "secrets": False,
            "connectors": False, "policies": False, "marketplace": False, "administration": False
        }
    }
}


@router.put("/admin/users/{user_uuid}/role")
def update_user_role(
    user_uuid: str,
    payload: RoleUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(RoleChecker(["admin", "SUPER_ADMIN", "ORG_OWNER"]))
):
    """Updates role for a targeted user account."""
    user = db.query(User).filter(User.uuid == user_uuid).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        
    old_role = user.role
    user.role = payload.role.strip().upper()
    db.commit()
    
    # Audit log entry
    audit = AuditLog(
        actor_id=admin_user.uuid,
        event_type="USER_ROLE_UPDATED",
        target_entity=user.uuid,
        correlation_id=str(uuid.uuid4()),
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()
    
    return {
        "success": True,
        "detail": f"User {user.email} role updated from {old_role} to {user.role}.",
        "user": {
            "uuid": user.uuid,
            "email": user.email,
            "role": user.role
        }
    }


@router.get("/admin/roles")
def get_roles_matrix(
    current_user: User = Depends(get_current_user)
):
    """Returns system role permissions matrix."""
    return {
        "success": True,
        "data": list(SYSTEM_ROLE_MATRIX.values()),
        "matrix": SYSTEM_ROLE_MATRIX
    }


@router.put("/admin/roles/{role_name}/permissions")
def update_role_permissions(
    role_name: str,
    payload: RolePermissionsUpdate,
    admin_user: User = Depends(RoleChecker(["admin", "SUPER_ADMIN", "ORG_OWNER"]))
):
    """Updates permission matrix for a specific system role."""
    key = role_name.upper()
    if key not in SYSTEM_ROLE_MATRIX:
        # Check by friendly name
        found_key = None
        for k, v in SYSTEM_ROLE_MATRIX.items():
            if v["role"].lower() == role_name.lower():
                found_key = k
                break
        if not found_key:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Role '{role_name}' not found.")
        key = found_key

    SYSTEM_ROLE_MATRIX[key]["permissions"].update(payload.permissions)
    return {
        "success": True,
        "detail": f"Permissions updated for role '{SYSTEM_ROLE_MATRIX[key]['role']}'.",
        "role": SYSTEM_ROLE_MATRIX[key]
    }

