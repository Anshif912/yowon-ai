"""
orchestrator.py — Orchestrates Repository Intelligence planning, scheduling, context slicing, and cache management.
"""

import time
import logging
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from intelligence.engine_contract import EngineResult, EngineStatus, run_isolated_engine
from intelligence.exceptions import RepositoryValidationError, CacheSerializationError
from utils.serialization import to_dict, from_dict

logger = logging.getLogger(__name__)

CURRENT_SCHEMA_VERSION = "3.0.0"
CURRENT_CACHE_VERSION = "3.0.0"
CURRENT_SERIALIZATION_VERSION = "1.0.0"


class RepositoryPlanner:
    """
    Phase 2: Repository Planner
    Analyzes codebase metrics to dynamically determine the optimal pipeline engine execution path.
    """
    @staticmethod
    def plan(scan_files: List[str], file_contents: Dict[str, str], detected_techs: List[str], total_loc: int) -> str:
        files_count = len(scan_files)
        
        # AI Framework Check
        techs_lower = [t.lower() for t in detected_techs]
        has_ai = any(any(ai_lib in t for ai_lib in ["crewai", "langgraph", "langchain", "ollama", "openai", "llama"]) for t in techs_lower)
        
        # Monorepo Check
        manifest_files = [f for f in scan_files if f.endswith(("package.json", "requirements.txt", "Cargo.toml", "go.mod"))]
        has_monorepo = len(manifest_files) > 1 and any("/" in m for m in manifest_files)
        
        # Documentation Ratio Check
        doc_files = [f for f in scan_files if f.lower().endswith((".md", ".txt", ".pdf", ".rst", ".html"))]
        doc_ratio = len(doc_files) / max(1, files_count)
        
        logger.info(
            f"[Planner] Inspecting repo: files={files_count}, loc={total_loc}, monorepo={has_monorepo}, ai={has_ai}, doc_ratio={doc_ratio:.2f}"
        )
        
        if doc_ratio > 0.85:
            return "DocPipeline"
        if has_ai:
            return "AIPipeline"
        if files_count >= 500 or total_loc > 50000 or has_monorepo:
            return "DeepPipeline"
        if files_count < 30 and total_loc < 3000:
            return "FastPipeline"
        return "StandardPipeline"


class ExecutionScheduler:
    """
    Phase 5: Dependency Graph Execution Scheduler.
    Runs engines isolated according to dependency layout, enforcing Quality Gates (Phase 3).
    """
    def __init__(self):
        self.results: Dict[str, EngineResult] = {}

    def run_stage(
        self,
        name: str,
        func: Any,
        fallback_payload: Any = None,
        quality_gate_min_confidence: float = 0.0,
        *args: Any,
        **kwargs: Any
    ) -> EngineResult:
        """Runs a stage under run_isolated_engine and stores the result."""
        res = run_isolated_engine(name, func, fallback_payload, quality_gate_min_confidence, *args, **kwargs)
        self.results[name] = res
        return res

    def get_timeline(self) -> List[Dict[str, Any]]:
        timeline = []
        for name, res in self.results.items():
            timeline.append({
                "stage": name,
                "status": res.status.value,
                "duration_seconds": res.duration,
                "memory_mb": res.memory,
                "confidence": res.confidence,
                "coverage": res.coverage
            })
        return timeline


class ContextRouter:
    """
    Phase 7: Retrieval-Augmented Context Routing.
    Splits codebase intelligence selectively to matching specialized agents.
    """
    @staticmethod
    def slice_context(ri_result_dict: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        # Pre-retrieve modules
        arch = ri_result_dict.get("architecture_graph") or {}
        tech = ri_result_dict.get("technology_graph") or {}
        evidence = ri_result_dict.get("evidence") or []
        metrics = ri_result_dict.get("metrics") or {}
        repo_tree = ri_result_dict.get("repository_tree") or []
        security = ri_result_dict.get("security_findings") or []
        file_contents = ri_result_dict.get("file_contents") or {}

        # Technical context
        tech_context = {
            "architecture_graph": arch,
            "dependency_graph": ri_result_dict.get("dependency_graph") or {},
            "metrics": metrics,
            "repository_tree": repo_tree,
            "detected_technologies": ri_result_dict.get("detected_technologies") or []
        }

        # Security context
        sec_context = {
            "security_findings": security,
            "evidence": [ev for ev in evidence if ev.get("severity") in ("HIGH", "CRITICAL") or "security" in str(ev.get("rule_id", "")).lower()],
            "dependency_graph": ri_result_dict.get("dependency_graph") or {}
        }

        # Presentation context
        readme_keys = [k for k in file_contents.keys() if "readme" in k.lower()]
        readme_data = {k: file_contents[k] for k in readme_keys[:3]}
        pres_context = {
            "readme_files": readme_data,
            "capabilities": ri_result_dict.get("capabilities") or [],
            "technology_summary": ri_result_dict.get("technology_summary") or "",
            "architecture_summary": ri_result_dict.get("architecture_summary") or ""
        }

        # Innovation context
        ai_evidence = [ev for ev in evidence if "ai" in str(ev.get("rule_id", "")).lower() or "llm" in str(ev.get("rule_id", "")).lower()]
        inno_context = {
            "ai_evidence": ai_evidence,
            "detected_technologies": ri_result_dict.get("detected_technologies") or [],
            "ai_intelligence": ri_result_dict.get("ai_intelligence") or {}
        }

        # Scalability context
        docker_files = {k: file_contents[k] for k in file_contents.keys() if "docker" in k.lower() or "compose" in k.lower()}
        scal_context = {
            "docker_configuration": docker_files,
            "architecture_summary": ri_result_dict.get("architecture_summary") or "",
            "dependency_intelligence": ri_result_dict.get("dependency_intelligence") or {}
        }

        return {
            "technical": tech_context,
            "security": sec_context,
            "presentation": pres_context,
            "innovation": inno_context,
            "scalability": scal_context
        }


class DiagnosticsCollector:
    """
    Phase 11: Developer Diagnostics Collector.
    Provides mathematically accurate coverage and telemetry diagnostics.
    """
    @staticmethod
    def collect(
        scan_files: List[str],
        discovered_count: int,
        loaded_count: int,
        parsed_count: int,
        total_loc: int,
        results: Dict[str, EngineResult],
        timeline: List[Dict[str, Any]],
        cache_status: str = "MISS"
    ) -> Dict[str, Any]:
        
        # Calculate coverage ratio mathematically (Phase 3)
        coverage_ratio = loaded_count / max(1, discovered_count)
        parser_success_rate = parsed_count / max(1, loaded_count)
        
        # Aggregate timeline metrics
        overall_duration = sum(r.duration for r in results.values())
        overall_mem = sum(r.memory for r in results.values())
        
        # Compute mathematical confidence rating
        # Based on: coverage, parser success, and average confidence of engines
        engine_confidences = [r.confidence for r in results.values() if r.confidence is not None]
        avg_engine_conf = sum(engine_confidences) / len(engine_confidences) if engine_confidences else 1.0
        mathematical_confidence = round(0.4 * coverage_ratio + 0.3 * parser_success_rate + 0.3 * avg_engine_conf, 3)

        return {
            "repository_coverage": round(coverage_ratio * 100.0, 1),
            "parser_success_rate": round(parser_success_rate * 100.0, 1),
            "files_discovered": discovered_count,
            "files_loaded": loaded_count,
            "files_parsed": parsed_count,
            "files_skipped": max(0, discovered_count - loaded_count),
            "total_loc": total_loc,
            "cache_status": cache_status,
            "engine_durations": {name: r.duration for name, r in results.items()},
            "execution_time_seconds": round(overall_duration, 3),
            "memory_usage_mb": round(overall_mem, 2),
            "execution_timeline": timeline,
            "confidence": mathematical_confidence,
            "confidence_label": "HIGH CONFIDENCE" if mathematical_confidence >= 0.85 else ("MEDIUM CONFIDENCE" if mathematical_confidence >= 0.6 else "LOW CONFIDENCE")
        }


class CacheManager:
    """
    Phase 11: Versioned Cache/Schema Management.
    Ensures safe serialization schemas, invalidates incompatible versions.
    """
    @staticmethod
    def load_cache(cached_data: Any) -> Optional[Dict[str, Any]]:
        if not cached_data or not isinstance(cached_data, dict):
            return None
        
        # Check versions
        schema_ver = cached_data.get("schema_version")
        cache_ver = cached_data.get("cache_version")
        serialization_ver = cached_data.get("serialization_version")

        # Invalidate if incompatible
        if schema_ver != CURRENT_SCHEMA_VERSION or cache_ver != CURRENT_CACHE_VERSION:
            logger.warning(
                f"[Cache] Incompatible cache version found. Expected schema={CURRENT_SCHEMA_VERSION}, cache={CURRENT_CACHE_VERSION}. Got schema={schema_ver}, cache={cache_ver}. Invalidating cache entry."
            )
            return None

        return cached_data

    @staticmethod
    def save_cache(cache_payload: Dict[str, Any]) -> Dict[str, Any]:
        # Inject current versions
        cache_payload["schema_version"] = CURRENT_SCHEMA_VERSION
        cache_payload["cache_version"] = CURRENT_CACHE_VERSION
        cache_payload["serialization_version"] = CURRENT_SERIALIZATION_VERSION
        return cache_payload
