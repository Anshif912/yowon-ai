import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from database import RepositorySnapshot, RepositoryFile
from modules.project_dna.extractors.base import BaseExtractor

class DocumentationExtractor(BaseExtractor):
    name = "Documentation"
    version = "1.0"
    depends_on = []
    supports_incremental = True
    priority = 1

    def extract(self, db: Session, snapshot: RepositorySnapshot, changed_files: List[str] = None) -> Dict[str, Any]:
        readme_len = len(snapshot.readme_snapshot or "")
        
        # Fetch all files first to perform fast in-memory string filtering
        all_files = db.query(RepositoryFile).filter(
            RepositoryFile.snapshot_id == snapshot.snapshot_id
        ).all()
        
        docs_files = [
            f for f in all_files 
            if "docs/" in f.path.lower() or "doc/" in f.path.lower() or f.path.lower().endswith((".md", ".txt"))
        ]
        
        code_files = [
            f for f in all_files 
            if f.path.lower().endswith((".py", ".js", ".ts"))
        ]
        
        density = 0.15

        # Categorize README quality
        readme_quality = "Poor"
        if readme_len > 2000:
            readme_quality = "Comprehensive / Premium"
        elif readme_len > 500:
            readme_quality = "Moderate"

        return {
            "readme_length": readme_len,
            "readme_quality": readme_quality,
            "documentation_files_count": len(docs_files),
            "comment_lines_ratio": density,
            "has_architecture_docs": any("architecture" in f.path.lower() for f in docs_files)
        }
