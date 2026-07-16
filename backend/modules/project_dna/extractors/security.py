import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from database import RepositorySnapshot, RepositoryFile
from modules.project_dna.extractors.base import BaseExtractor

class SecurityExtractor(BaseExtractor):
    name = "Security"
    version = "1.0"
    depends_on = []
    supports_incremental = True
    priority = 2

    def extract(self, db: Session, snapshot: RepositorySnapshot, changed_files: List[str] = None) -> Dict[str, Any]:
        all_files = db.query(RepositoryFile).filter(
            RepositoryFile.snapshot_id == snapshot.snapshot_id
        ).all()
        files = [
            f for f in all_files 
            if f.path.lower().endswith((".py", ".js", ".ts", ".go", ".env", ".env.example"))
        ]
        
        env_vars = []
        secrets_references = []
        auth_patterns = []

        for f in files:
            path_lower = f.path.lower()
            if "auth" in path_lower or "security" in path_lower or "login" in path_lower:
                auth_patterns.append("OAuth2" if "oauth" in path_lower else "JWT")
            if "secret" in path_lower or "key" in path_lower:
                secrets_references.append(f.path)

        return {
            "environment_variables": sorted(list(set(env_vars)))[:50],
            "hardcoded_secrets_risk_count": len(secrets_references),
            "auth_mechanisms": sorted(list(set(auth_patterns))),
            "has_ssl_config": any("ssl" in f.path.lower() or "https" in f.path.lower() for f in files)
        }
