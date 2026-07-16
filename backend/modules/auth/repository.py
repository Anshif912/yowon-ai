from typing import Optional
from sqlalchemy.orm import Session
from database import User

class AuthRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> Optional[User]:
        """Finds user by lowercase email address."""
        return self.db.query(User).filter(User.email == email.lower()).first()

    def get_by_uuid(self, uuid: str) -> Optional[User]:
        """Finds user by UUID."""
        return self.db.query(User).filter(User.uuid == uuid).first()

    def create(self, user: User) -> User:
        """Saves a new user instance to the database."""
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def count_administrators(self) -> int:
        """Counts the total number of users with role='admin'."""
        return self.db.query(User).filter(User.role == "admin").count()
