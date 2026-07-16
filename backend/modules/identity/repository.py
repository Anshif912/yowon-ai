from sqlalchemy.orm import Session
from core.common.base import BaseRepository
from database import User, Session as UserSession
from typing import Optional

class IdentityRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(db, User)

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email.lower()).first()

    def get_session_by_jti(self, jti: str) -> Optional[UserSession]:
        return self.db.query(UserSession).filter(UserSession.token_jti == jti).first()

    def create_session(self, session: UserSession) -> UserSession:
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session
