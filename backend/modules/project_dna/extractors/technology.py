import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from database import RepositorySnapshot, Technology
from modules.project_dna.extractors.base import BaseExtractor

class TechnologyExtractor(BaseExtractor):
    name = "Technology"
    version = "1.0"
    depends_on = []
    supports_incremental = True
    priority = 1

    def extract(self, db: Session, snapshot: RepositorySnapshot, changed_files: List[str] = None) -> Dict[str, Any]:
        tech_summary = {}
        if snapshot.technology_summary:
            try:
                tech_summary = json.loads(snapshot.technology_summary)
            except Exception:
                pass
                
        # Also query the structured database list for technologies
        tech_entities = db.query(Technology).filter(Technology.repository_id == snapshot.repository_id).all()
        entities = {t.name: t.version or "latest" for t in tech_entities}
        
        # Merge them
        merged_techs = {**tech_summary, **entities}
        
        # Classify technologies
        languages = []
        frameworks = []
        libraries = []
        for name in merged_techs.keys():
            name_lower = name.lower()
            if name_lower in ["python", "javascript", "typescript", "go", "java", "c++", "rust", "ruby"]:
                languages.append(name)
            elif name_lower in ["fastapi", "flask", "django", "react", "vue", "next.js", "nest.js", "express"]:
                frameworks.append(name)
            else:
                libraries.append(name)

        return {
            "languages": sorted(languages),
            "frameworks": sorted(frameworks),
            "libraries": sorted(libraries)[:50],
            "raw_techs": merged_techs
        }
