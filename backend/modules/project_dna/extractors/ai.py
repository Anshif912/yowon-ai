import re
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from database import RepositorySnapshot, RepositoryFile, Dependency
from modules.project_dna.extractors.base import BaseExtractor

class AIExtractor(BaseExtractor):
    name = "AI"
    version = "1.0"
    depends_on = []
    supports_incremental = True
    priority = 2

    def extract(self, db: Session, snapshot: RepositorySnapshot, changed_files: List[str] = None) -> Dict[str, Any]:
        # 1. Identify AI library dependencies
        deps = db.query(Dependency).filter(Dependency.repository_id == snapshot.repository_id).all()
        ai_libs = []
        vector_dbs = []
        for d in deps:
            name = d.name.lower()
            if name in ["openai", "langchain", "crewai", "langgraph", "chromadb", "pinecone", "qdrant", "weaviate", "milvus", "llama-index", "anthropic", "google-generativeai"]:
                ai_libs.append(d.name)
            if name in ["chromadb", "pinecone", "qdrant", "weaviate", "milvus"]:
                vector_dbs.append(d.name)
                
        # 2. Scan code files for prompt patterns, LLM classes or agent configurations
        all_files = db.query(RepositoryFile).filter(
            RepositoryFile.snapshot_id == snapshot.snapshot_id
        ).all()
        files = [
            f for f in all_files 
            if f.path.lower().endswith((".py", ".js", ".ts"))
        ]
        
        prompt_templates = []
        agents = []
        
        for f in files:
            path_lower = f.path.lower()
            if "prompt" in path_lower or "agent" in path_lower or "llm" in path_lower or "rag" in path_lower:
                agents.append(f.path.split("/")[-1].split(".")[0])

        return {
            "ai_libraries": sorted(list(set(ai_libs))),
            "vector_databases": sorted(list(set(vector_dbs))),
            "prompt_templates_count": len(prompt_templates),
            "prompt_snippets": sorted(list(set(prompt_templates)))[:10],
            "agent_classes": sorted(list(set(agents)))[:20],
            "is_ai_active": len(ai_libs) > 0 or len(prompt_templates) > 0
        }
