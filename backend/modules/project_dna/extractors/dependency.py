import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from database import RepositorySnapshot, Dependency
from modules.project_dna.extractors.base import BaseExtractor

class DependencyExtractor(BaseExtractor):
    name = "Dependency"
    version = "1.0"
    depends_on = []
    supports_incremental = True
    priority = 1

    def extract(self, db: Session, snapshot: RepositorySnapshot, changed_files: List[str] = None) -> Dict[str, Any]:
        dep_summary = {}
        if snapshot.dependency_summary:
            try:
                dep_summary = json.loads(snapshot.dependency_summary)
            except Exception:
                pass
                
        deps = db.query(Dependency).filter(Dependency.repository_id == snapshot.repository_id).all()
        internal_deps = []
        external_deps = []
        for d in deps:
            if d.name.startswith(("./", "../", "@local/")):
                internal_deps.append(d.name)
            else:
                external_deps.append(d.name)

        return {
            "internal_dependencies": sorted(list(set(internal_deps)))[:50],
            "external_dependencies": sorted(list(set(external_deps)))[:50],
            "coupling_ratio": round(len(internal_deps) / max(len(external_deps), 1), 4),
            "raw_summary": dep_summary
        }
