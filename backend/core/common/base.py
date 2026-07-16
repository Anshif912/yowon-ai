from sqlalchemy.orm import Session
from typing import Generic, TypeVar, Type, List, Optional

T = TypeVar('T')

class BaseRepository(Generic[T]):
    def __init__(self, db: Session, model: Type[T]):
        self.db = db
        self.model = model

    def get_by_uuid(self, uuid: str) -> Optional[T]:
        # Tries filtering by uuid or workspace_id/id
        for attr in ['uuid', 'workspace_id', 'id']:
            if hasattr(self.model, attr):
                col = getattr(self.model, attr)
                return self.db.query(self.model).filter(col == uuid).first()
        return None

    def create(self, obj: T) -> T:
        self.db.add(obj)
        self.db.commit()
        self.db.refresh(obj)
        return obj

    def save(self) -> None:
        self.db.commit()

    def delete(self, obj: T) -> None:
        self.db.delete(obj)
        self.db.commit()


class BaseService(Generic[T]):
    def __init__(self, repository: BaseRepository[T]):
        self.repository = repository
