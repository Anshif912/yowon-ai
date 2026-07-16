from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db, User, Notification
from auth.security import get_current_user
from modules.notifications.schemas import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all notifications for the active authenticated user."""
    return db.query(Notification).filter(
        Notification.user_id == current_user.uuid
    ).order_by(Notification.timestamp.desc()).all()

@router.put("/{id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marks a user notification as read."""
    notif = db.query(Notification).filter(
        Notification.uuid == id,
        Notification.user_id == current_user.uuid
    ).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif
