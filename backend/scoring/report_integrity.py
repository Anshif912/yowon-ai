"""
report_integrity.py
Generates cryptographic hash signatures, repository fingerprints (DNA),
and comprehensive evaluation metadata for enterprise auditability.
"""

import hashlib
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

def compute_report_hash(verdict_data: Dict[str, Any]) -> str:
    """Computes a stable SHA256 hash of the verdict dictionary."""
    try:
        # Normalize: convert anything not basic to string, sort keys, remove whitespace
        serialized = json.dumps(
            verdict_data,
            sort_keys=True,
            default=str,
            separators=(',', ':')
        )
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()
    except Exception as exc:
        return f"failed-to-sign-{str(exc)}"

def build_report_metadata(ri_result: Optional[Any], eval_run: Optional[Any], commit_sha: str, project: Any) -> Dict[str, Any]:
    """Builds the comprehensive audit trail metadata for the report."""
    diag = getattr(ri_result, "diagnostics", None) if ri_result else None
    
    # Telemetry and version counters
    engine_ver = getattr(diag, "engine_version", "2.0.0") if diag else "2.0.0"
    duration = getattr(diag, "execution_time_seconds", 0.0) if diag else 0.0
    evidence_count = len(getattr(ri_result, "evidence", [])) if ri_result else 0
    
    knowledge_graph = getattr(ri_result, "knowledge_graph", {}) if ri_result else {}
    knowledge_nodes = len(knowledge_graph.get("nodes", [])) if isinstance(knowledge_graph, dict) else 0
    knowledge_edges = len(knowledge_graph.get("edges", [])) if isinstance(knowledge_graph, dict) else 0
    
    eval_id = getattr(eval_run, "evaluation_id", "unknown-eval-id") if eval_run else "unknown-eval-id"
    branch = getattr(eval_run, "branch", "main") if eval_run and hasattr(eval_run, "branch") else "main"
    
    return {
        "evaluation_id": eval_id,
        "repository_commit": commit_sha[:8] if commit_sha else "unknown-commit",
        "repository_commit_full": commit_sha or "unknown-commit",
        "repository_branch": branch or "main",
        "evaluation_version": "1.0.0",
        "ri_engine_version": engine_ver,
        "council_version": "9.1",
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "duration_seconds": round(duration, 2),
        "evidence_count": evidence_count,
        "knowledge_nodes": knowledge_nodes,
        "knowledge_edges": knowledge_edges
    }

def build_fingerprint(ri_result: Optional[Any], detected_technologies: List[str], architecture_summary: str) -> Dict[str, Any]:
    """Generates the Repository DNA fingerprint representing its structural identity."""
    diag = getattr(ri_result, "diagnostics", None) if ri_result else None
    
    loc = getattr(diag, "total_loc", 0) if diag else 0
    files = getattr(diag, "total_files", 0) if diag else 0
    classes = getattr(diag, "total_classes", 0) if diag else 0
    functions = getattr(diag, "total_functions", 0) if diag else 0
    dependencies = getattr(diag, "total_dependencies", 0) if diag else 0
    
    # Categorize languages and frameworks
    techs = [t.lower() for t in detected_technologies]
    langs = []
    frameworks = []
    
    lang_map = {
        "python": "Python", "typescript": "TypeScript", "javascript": "JavaScript",
        "go": "Go", "rust": "Rust", "java": "Java", "c#": "C#", "ruby": "Ruby",
        "php": "PHP", "html": "HTML", "css": "CSS"
    }
    fw_map = {
        "fastapi": "FastAPI", "react": "React", "django": "Django", "express": "Express",
        "next": "Next.js", "vue": "Vue", "angular": "Angular", "redis": "Redis",
        "postgres": "PostgreSQL", "mysql": "MySQL", "docker": "Docker", "kubernetes": "Kubernetes"
    }
    
    for t in detected_technologies:
        t_low = t.lower()
        if t_low in lang_map:
            langs.append(lang_map[t_low])
        elif any(k in t_low for k in fw_map):
            # Match part of name (e.g. nextjs, next.js -> Next.js)
            matched = False
            for k, val in fw_map.items():
                if k in t_low:
                    frameworks.append(val)
                    matched = True
                    break
            if not matched:
                frameworks.append(t)
        else:
            frameworks.append(t)
            
    # Clean duplicates
    langs = list(dict.fromkeys(langs)) or ["Universal"]
    frameworks = list(dict.fromkeys(frameworks)) or ["None detected"]
    
    # Determine project type
    proj_type = "Library"
    if "fastapi" in techs or "express" in techs or "django" in techs:
        proj_type = "Backend API Service"
    elif "react" in techs or "next" in techs or "vue" in techs:
        proj_type = "Frontend Web App"
    elif "docker" in techs and len(techs) > 3:
        proj_type = "Containerized Service"
        
    # Architecture description
    arch = "Monolithic Core"
    if architecture_summary:
        arch = architecture_summary
    elif len(ri_result.architecture_graph.get("nodes", [])) > 5 if ri_result and hasattr(ri_result, "architecture_graph") else False:
        arch = "Distributed Microservices"
    elif "fastapi" in techs and "react" in techs:
        arch = "Split Front/Back Architecture"
        
    return {
        "repository_type": proj_type,
        "primary_languages": langs,
        "frameworks": frameworks,
        "architecture": arch,
        "total_loc": loc,
        "total_files": files,
        "total_classes": classes,
        "total_functions": functions,
        "total_dependencies": dependencies,
        "generated_at": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    }
