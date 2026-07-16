from typing import Dict, Any, List
from sqlalchemy.orm import Session
from database import RepositorySnapshot, RepositoryFile
from modules.project_dna.extractors.base import BaseExtractor

class DeploymentExtractor(BaseExtractor):
    name = "Deployment"
    version = "1.0"
    depends_on = ["Repository"]
    supports_incremental = True
    priority = 2

    def extract(self, db: Session, snapshot: RepositorySnapshot, changed_files: List[str] = None) -> Dict[str, Any]:
        all_files = db.query(RepositoryFile).filter(
            RepositoryFile.snapshot_id == snapshot.snapshot_id
        ).all()
        files = [
            f for f in all_files 
            if "docker" in f.path.lower() or f.path.lower().endswith((".tf", ".tfvars")) or "k8s" in f.path.lower() or "kubernetes" in f.path.lower()
        ]
        
        deployment_modes = []
        infra_tools = []
        cloud_providers = []

        for f in files:
            path_lower = f.path.lower()
            if "dockerfile" in path_lower:
                deployment_modes.append("Docker")
            if "docker-compose" in path_lower or "compose.yml" in path_lower:
                deployment_modes.append("Docker Compose")
            if "k8s" in path_lower or "kubernetes" in path_lower:
                deployment_modes.append("Kubernetes")
            if path_lower.endswith(".tf"):
                infra_tools.append("Terraform")
            if "aws" in path_lower:
                cloud_providers.append("AWS")
            if "azure" in path_lower:
                cloud_providers.append("Azure")
            if "gcp" in path_lower or "google" in path_lower:
                cloud_providers.append("GCP")

        return {
            "deployment_modes": sorted(list(set(deployment_modes))),
            "infrastructure_as_code": sorted(list(set(infra_tools))),
            "target_cloud_providers": sorted(list(set(cloud_providers))),
            "has_containerization": any(mode in ["Docker", "Kubernetes"] for mode in deployment_modes)
        }
