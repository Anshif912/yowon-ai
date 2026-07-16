import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.orm import Session as DbSession
from database import Session as UserSessionModel

class SessionService:
    def __init__(self, db: DbSession):
        self.db = db

    def create_user_session(
        self,
        user_uuid: str,
        token_jti: str,
        device_name: Optional[str] = None,
        browser: Optional[str] = None,
        os_name: Optional[str] = None,
        ip_address: Optional[str] = None,
        expire_days: int = 7
    ) -> UserSessionModel:
        """Saves a new user session mapping in the database."""
        session = UserSessionModel(
            uuid=str(uuid.uuid4()),
            user_id=user_uuid,
            device_name=device_name or "Unknown Device",
            browser=browser or "Unknown Browser",
            os=os_name or "Unknown OS",
            ip_address=ip_address,
            token_jti=token_jti,
            last_active=datetime.utcnow(),
            is_revoked=False
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_session_by_jti(self, jti: str) -> Optional[UserSessionModel]:
        """Finds session by its JTI claim."""
        return self.db.query(UserSessionModel).filter(
            UserSessionModel.token_jti == jti,
            UserSessionModel.is_revoked == False
        ).first()

    def revoke_session_by_jti(self, jti: str) -> None:
        """Revokes a session by marking is_revoked = True."""
        session = self.get_session_by_jti(jti)
        if session:
            session.is_revoked = True
            self.db.commit()

    def revoke_all_user_sessions(self, user_uuid: str) -> None:
        """Revokes all active sessions for a user."""
        self.db.query(UserSessionModel).filter(
            UserSessionModel.user_id == user_uuid,
            UserSessionModel.is_revoked == False
        ).update({UserSessionModel.is_revoked: True}, synchronize_session=False)
        self.db.commit()

    def get_active_sessions(self, user_uuid: str) -> List[UserSessionModel]:
        """Lists active sessions for a user."""
        return self.db.query(UserSessionModel).filter(
            UserSessionModel.user_id == user_uuid,
            UserSessionModel.is_revoked == False
        ).order_by(UserSessionModel.last_active.desc()).all()
