import math
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from database import RepositorySnapshot, RepositoryFolder, RepositoryFile
from modules.project_dna.extractors.base import BaseExtractor

class RepositoryExtractor(BaseExtractor):
    name = "Repository"
    version = "1.0"
    depends_on = []
    supports_incremental = True
    priority = 1

    def extract(self, db: Session, snapshot: RepositorySnapshot, changed_files: List[str] = None) -> Dict[str, Any]:
        # Fetch folders from DB
        folders = db.query(RepositoryFolder).filter(RepositoryFolder.snapshot_id == snapshot.snapshot_id).all()
        files = db.query(RepositoryFile).filter(RepositoryFile.snapshot_id == snapshot.snapshot_id).all()
        
        folder_paths = [f.path for f in folders]
        file_paths = [f.path for f in files]
        
        # Calculate naming conventions
        naming_conventions = {"snake_case": 0, "camelCase": 0, "PascalCase": 0, "kebab-case": 0}
        for path in file_paths:
            name = path.split("/")[-1].split(".")[0]
            if "_" in name:
                naming_conventions["snake_case"] += 1
            elif "-" in name:
                naming_conventions["kebab-case"] += 1
            elif name and name[0].isupper():
                naming_conventions["PascalCase"] += 1
            else:
                naming_conventions["camelCase"] += 1
                
        # Calculate folder depth entropy
        depths = [path.count("/") for path in file_paths]
        entropy = 0.0
        if depths:
            distinct_depths = set(depths)
            for d in distinct_depths:
                p = depths.count(d) / len(depths)
                entropy -= p * math.log2(p)

        return {
            "folder_count": len(folders),
            "file_count": len(files),
            "folder_paths": sorted(folder_paths)[:50],  # cap list
            "naming_conventions": naming_conventions,
            "entropy": round(entropy, 4)
        }
