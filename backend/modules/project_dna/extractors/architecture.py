import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from database import RepositorySnapshot, KnowledgeGraphNode
from modules.project_dna.extractors.base import BaseExtractor

class ArchitectureExtractor(BaseExtractor):
    name = "Architecture"
    version = "1.0"
    depends_on = ["Repository"]
    supports_incremental = True
    priority = 2

    def extract(self, db: Session, snapshot: RepositorySnapshot, changed_files: List[str] = None) -> Dict[str, Any]:
        arch_data = {}
        if snapshot.architecture_summary:
            try:
                arch_data = json.loads(snapshot.architecture_summary)
            except Exception:
                pass
                
        # Parse components from Knowledge Graph nodes
        nodes = db.query(KnowledgeGraphNode).filter(
            KnowledgeGraphNode.type.in_(["service", "controller", "model", "worker", "pipeline", "agent"])
        ).all()
        
        layers = {"controllers": 0, "services": 0, "repositories": 0, "workers": 0, "pipelines": 0, "agents": 0}
        component_names = []
        for node in nodes:
            component_names.append(node.name)
            node_type = str(node.type).lower()
            if "controller" in node_type or "router" in node_type:
                layers["controllers"] += 1
            elif "service" in node_type:
                layers["services"] += 1
            elif "repo" in node_type:
                layers["repositories"] += 1
            elif "worker" in node_type:
                layers["workers"] += 1
            elif "pipeline" in node_type:
                layers["pipelines"] += 1
            elif "agent" in node_type:
                layers["agents"] += 1
                
        # Determine architecture patterns
        pattern = "Unknown"
        if layers["controllers"] > 0 and layers["services"] > 0 and layers["repositories"] > 0:
            pattern = "Layered Architecture / Clean Architecture"
        elif layers["controllers"] > 0 and layers["repositories"] > 0:
            pattern = "MVC / Active Record"

        return {
            "layers_count": layers,
            "architecture_pattern": pattern,
            "components": sorted(list(set(component_names)))[:100],
            "raw_summary": arch_data
        }
