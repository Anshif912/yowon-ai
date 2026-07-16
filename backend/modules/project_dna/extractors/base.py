from typing import Dict, Any, List
from sqlalchemy.orm import Session
from database import RepositorySnapshot

class BaseExtractor:
    name: str = "Base"
    version: str = "1.0"
    depends_on: List[str] = []
    supports_incremental: bool = True
    priority: int = 1

    def extract(self, db: Session, snapshot: RepositorySnapshot, changed_files: List[str] = None) -> Dict[str, Any]:
        """
        Runs the extraction logic.
        Returns a dictionary representing the dimensions payload.
        """
        raise NotImplementedError
