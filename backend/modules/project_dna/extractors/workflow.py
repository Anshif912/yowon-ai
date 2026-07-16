import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from database import RepositorySnapshot, RepositoryFile
from modules.project_dna.extractors.base import BaseExtractor

class WorkflowExtractor(BaseExtractor):
    name = "Workflow"
    version = "1.0"
    depends_on = ["Repository"]
    supports_incremental = True
    priority = 2

    def extract(self, db: Session, snapshot: RepositorySnapshot, changed_files: List[str] = None) -> Dict[str, Any]:
        files = db.query(RepositoryFile).filter(
            RepositoryFile.snapshot_id == snapshot.snapshot_id,
            RepositoryFile.path.like("%workflow%") | RepositoryFile.path.like("%.github/workflows/%") | RepositoryFile.path.like("%ci%")
        ).all()
        
        triggers = ["push", "pull_request"]
        jobs = []
        providers = []

        for f in files:
            path_lower = f.path.lower()
            if ".github/workflows" in path_lower:
                providers.append("GitHub Actions")
            elif "gitlab-ci" in path_lower:
                providers.append("GitLab CI")
            elif "jenkins" in path_lower:
                providers.append("Jenkins")
            jobs.append(f.path.split("/")[-1].split(".")[0])

        return {
            "ci_providers": sorted(list(set(providers))),
            "triggers": sorted(list(set(triggers))),
            "job_names": sorted(list(set(jobs))),
            "has_ci_cd": len(providers) > 0
        }
