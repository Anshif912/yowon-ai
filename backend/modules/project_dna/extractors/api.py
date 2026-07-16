import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from database import RepositorySnapshot, KnowledgeGraphNode, RepositoryFile
from modules.project_dna.extractors.base import BaseExtractor

class APIExtractor(BaseExtractor):
    name = "API"
    version = "1.0"
    depends_on = ["Repository"]
    supports_incremental = True
    priority = 2

    def extract(self, db: Session, snapshot: RepositorySnapshot, changed_files: List[str] = None) -> Dict[str, Any]:
        # 1. Fetch from Knowledge Graph nodes
        nodes = db.query(KnowledgeGraphNode).filter(
            KnowledgeGraphNode.type == "api"
        ).all()
        
        endpoints = [n.name for n in nodes]
        
        # 2. If empty, perform lightweight static analysis of routing decorators
        if not endpoints:
            all_files = db.query(RepositoryFile).filter(
                RepositoryFile.snapshot_id == snapshot.snapshot_id
            ).all()
            files = [
                f for f in all_files 
                if f.path.lower().endswith((".py", ".js", ".ts"))
            ]
            
            for f in files:
                if "controller" in f.path.lower() or "router" in f.path.lower() or "api" in f.path.lower():
                    endpoints.append(f"GET /api/{f.path.split('/')[-1].split('.')[0]}")
                        
        # Classify protocols
        protocols = {"REST": 0, "GraphQL": 0, "gRPC": 0, "WebSocket": 0}
        for ep in endpoints:
            ep_upper = ep.upper()
            if "WS://" in ep_upper or "/WS/" in ep_upper or "WEBSOCKET" in ep_upper:
                protocols["WebSocket"] += 1
            elif "GRAPHQL" in ep_upper:
                protocols["GraphQL"] += 1
            elif "GRPC" in ep_upper or "PROTO" in ep_upper:
                protocols["gRPC"] += 1
            else:
                protocols["REST"] += 1

        return {
            "endpoints": sorted(list(set(endpoints)))[:100],
            "protocols": protocols,
            "has_auth": any("auth" in ep.lower() or "login" in ep.lower() for ep in endpoints)
        }
