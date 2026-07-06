import time
import hashlib
import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from database import RepositorySnapshot, Evidence, Recommendation, RepositoryFile, RepositoryAnalysis, IntelligenceModuleStatus
from datetime import datetime

from intelligence.models import (
    RepositoryTreeNode, SymbolRecord, EvidenceRecord, 
    TechnologyRecord, RecommendationRecord
)
from intelligence.cache_engine import RepositoryAnalysisCache
from intelligence.symbol_indexer import SymbolIndexer
from intelligence.security_engine import SecurityEngine
from intelligence.evidence_engine import EvidenceEngine
from intelligence.architecture_engine import ArchitectureEngine
from intelligence.metrics_engine import MetricsEngine
from intelligence.health_engine import HealthEngine
from intelligence.recommendation_engine import RecommendationEngine

from intelligence.graph.architecture_graph import ArchitectureGraphBuilder
from intelligence.graph.dependency_graph import DependencyGraphBuilder
from intelligence.graph.call_graph import CallGraphBuilder
from intelligence.graph.technology_graph import TechnologyGraphBuilder

logger = logging.getLogger(__name__)


def update_analysis_status(
    db: Session,
    snapshot_id: str,
    commit_sha: str,
    status: str,
    current_stage: Optional[str] = None,
    progress: int = 0,
    current_module: Optional[str] = None,
    files_processed: int = 0,
    error_message: Optional[str] = None,
    completed_stages: Optional[List[str]] = None,
    started_at: Optional[datetime] = None,
    ended_at: Optional[datetime] = None,
    duration: Optional[float] = None
) -> None:
    """Updates status columns of the RepositoryAnalysis cache row in DB."""
    try:
        analysis = db.query(RepositoryAnalysis).filter(RepositoryAnalysis.commit_sha == commit_sha).first()
        if not analysis:
            analysis = RepositoryAnalysis(
                repository_snapshot_id=snapshot_id,
                commit_sha=commit_sha,
                analysis_version="2.0.0",
                engine_version="2.0.0"
            )
            db.add(analysis)
        
        analysis.status = status
        if current_stage is not None:
            analysis.current_stage = current_stage
        analysis.progress = progress
        if current_module is not None:
            analysis.current_module = current_module
        if files_processed > 0:
            analysis.files_processed = files_processed
        if error_message is not None:
            analysis.error_message = error_message
        if completed_stages is not None:
            analysis.completed_stages = json.dumps(completed_stages)
        if started_at is not None:
            analysis.started_at = started_at
        if ended_at is not None:
            analysis.ended_at = ended_at
        if duration is not None:
            analysis.duration = duration
        
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"[Intel] Failed to update analysis status in database: {e}")


def update_module_status(
    db: Session,
    commit_sha: str,
    module_name: str,
    status: str,
    started_at: Optional[datetime] = None,
    finished_at: Optional[datetime] = None,
    duration_seconds: Optional[float] = None,
    error_message: Optional[str] = None,
    cache_hit: bool = False,
    files_processed: int = 0
) -> None:
    """Helper to update state of individual static analysis stages/modules."""
    try:
        analysis = db.query(RepositoryAnalysis).filter(RepositoryAnalysis.commit_sha == commit_sha).first()
        if not analysis:
            return
        
        module_status = db.query(IntelligenceModuleStatus).filter(
            IntelligenceModuleStatus.analysis_id == analysis.analysis_id,
            IntelligenceModuleStatus.module_name == module_name
        ).first()

        if not module_status:
            module_status = IntelligenceModuleStatus(
                analysis_id=analysis.analysis_id,
                module_name=module_name
            )
        
        module_status.status = status
        if started_at is not None:
            module_status.started_at = started_at
        if finished_at is not None:
            module_status.finished_at = finished_at
        if duration_seconds is not None:
            module_status.duration_seconds = duration_seconds
        if error_message is not None:
            module_status.error_message = error_message
        module_status.cache_hit = cache_hit
        if files_processed > 0:
            module_status.files_processed = files_processed
        
        db.merge(module_status)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"[Intel] Failed to update module status for {module_name}: {e}")


def run_repository_intelligence(db: Session, evaluation: Any, snapshot_id: str) -> Dict[str, Any]:
    """Orchestrates code intelligence static analysis over a repository snapshot."""
    t_start = time.perf_counter()
    started_at = datetime.utcnow()
    
    # 1. Fetch current snapshot and commit details
    snapshot = db.query(RepositorySnapshot).filter(RepositorySnapshot.snapshot_id == snapshot_id).first()
    if not snapshot:
        raise ValueError(f"Snapshot not found: {snapshot_id}")
    
    commit_sha = snapshot.commit_sha
    
    # 2. Check Hybrid Cache
    cached_data = RepositoryAnalysisCache.get(commit_sha, db)
    if cached_data:
        logger.info("[Intel] Cache hit for commit=%s", commit_sha)
        # Populate DB tables if they are empty
        _sync_database_records(db, evaluation, cached_data["evidence"], cached_data["recommendations"])
        update_analysis_status(
            db=db,
            snapshot_id=snapshot_id,
            commit_sha=commit_sha,
            status="COMPLETED",
            current_stage="Analysis complete",
            progress=100,
            started_at=started_at,
            ended_at=datetime.utcnow()
        )
        # Mark all modules as completed (cache hit)
        modules = ["source_loading", "symbol_indexing", "ecosystem_parsing", "compliance_rules", "architecture_mapping", "complexity_metrics", "semantic_graphs"]
        for m in modules:
            update_module_status(db, commit_sha, m, "completed", cache_hit=True)
        return cached_data

    logger.info("[Intel] Cache miss. Initiating static analysis for commit=%s", commit_sha)
    completed_steps = []
    
    try:
        update_analysis_status(
            db=db,
            snapshot_id=snapshot_id,
            commit_sha=commit_sha,
            status="INITIALIZING",
            current_stage="Initializing engines",
            progress=5,
            started_at=started_at,
            completed_stages=completed_steps
        )
        
        # 3. Read cached repository tree metadata or query DB files
        files_list = []
        if snapshot.folder_structure:
            try:
                files_list = json.loads(snapshot.folder_structure)
            except Exception:
                files_list = []

        dependencies = {}
        if snapshot.dependency_summary:
            try:
                dependencies = json.loads(snapshot.dependency_summary)
            except Exception:
                dependencies = {}

        symbol_indexer = SymbolIndexer()
        security_engine = SecurityEngine()
        
        prev_snapshot_id = snapshot.previous_snapshot_id
        prev_snapshot = db.query(RepositorySnapshot).filter(RepositorySnapshot.snapshot_id == prev_snapshot_id).first() if prev_snapshot_id else None
        
        # -------------------------------------------------------------
        # Module 1: Source Loading
        # -------------------------------------------------------------
        t_mod_start = time.perf_counter()
        update_module_status(db, commit_sha, "source_loading", "running", started_at=datetime.utcnow())
        try:
            update_analysis_status(
                db=db, snapshot_id=snapshot_id, commit_sha=commit_sha,
                status="FETCHING_SOURCE", current_stage="Loading source files",
                progress=10, completed_stages=completed_steps
            )
            source_files_content = _load_source_contents_from_github_cache(snapshot.repository.github_url)
            completed_steps.append("Source Files Loaded")
            t_mod_end = time.perf_counter()
            update_module_status(
                db=db, commit_sha=commit_sha, module_name="source_loading",
                status="completed", finished_at=datetime.utcnow(),
                duration_seconds=t_mod_end - t_mod_start, files_processed=len(files_list)
            )
        except Exception as e:
            logger.exception("[Intel] Source loading failed")
            source_files_content = {}
            t_mod_end = time.perf_counter()
            update_module_status(
                db=db, commit_sha=commit_sha, module_name="source_loading",
                status="failed", finished_at=datetime.utcnow(),
                duration_seconds=t_mod_end - t_mod_start, error_message=str(e)
            )

        # -------------------------------------------------------------
        # Module 2: Symbol Indexing
        # -------------------------------------------------------------
        t_mod_start = time.perf_counter()
        update_module_status(db, commit_sha, "symbol_indexing", "running", started_at=datetime.utcnow())
        try:
            update_analysis_status(
                db=db, snapshot_id=snapshot_id, commit_sha=commit_sha,
                status="INDEXING", current_stage="Indexing codebase symbols",
                progress=20, files_processed=len(files_list), completed_stages=completed_steps
            )
            for fpath in files_list:
                content = source_files_content.get(fpath, "")
                symbol_indexer.index_file(fpath, content)
                security_engine.scan_file(fpath, content)
            t_mod_end = time.perf_counter()
            update_module_status(
                db=db, commit_sha=commit_sha, module_name="symbol_indexing",
                status="completed", finished_at=datetime.utcnow(),
                duration_seconds=t_mod_end - t_mod_start, files_processed=len(files_list)
            )
        except Exception as e:
            logger.exception("[Intel] Symbol indexing failed")
            t_mod_end = time.perf_counter()
            update_module_status(
                db=db, commit_sha=commit_sha, module_name="symbol_indexing",
                status="failed", finished_at=datetime.utcnow(),
                duration_seconds=t_mod_end - t_mod_start, error_message=str(e)
            )

        # -------------------------------------------------------------
        # Module 3: Ecosystem Parsing
        # -------------------------------------------------------------
        t_mod_start = time.perf_counter()
        update_module_status(db, commit_sha, "ecosystem_parsing", "running", started_at=datetime.utcnow())
        file_imports = {}
        file_parsers = {}
        try:
            from intelligence.parsers.parser_registry import ParserRegistry
            for fpath in files_list:
                try:
                    parser = ParserRegistry.get_parser(fpath)
                    parser.load(source_files_content.get(fpath, ""), fpath)
                    if parser.parse():
                        file_imports[fpath] = parser.get_imports()
                        file_parsers[fpath] = parser
                    else:
                        file_imports[fpath] = []
                except Exception as parse_err:
                    logger.error(f"[Intel] Failed parsing file {fpath}: {parse_err}")
                    file_imports[fpath] = []
            
            completed_steps.append("Ecosystem Indexing Complete")
            t_mod_end = time.perf_counter()
            update_module_status(
                db=db, commit_sha=commit_sha, module_name="ecosystem_parsing",
                status="completed", finished_at=datetime.utcnow(),
                duration_seconds=t_mod_end - t_mod_start, files_processed=len(files_list)
            )
        except Exception as e:
            logger.exception("[Intel] Ecosystem parsing failed")
            t_mod_end = time.perf_counter()
            update_module_status(
                db=db, commit_sha=commit_sha, module_name="ecosystem_parsing",
                status="failed", finished_at=datetime.utcnow(),
                duration_seconds=t_mod_end - t_mod_start, error_message=str(e)
            )

        # -------------------------------------------------------------
        # Module 4: Compliance Rules
        # -------------------------------------------------------------
        t_mod_start = time.perf_counter()
        update_module_status(db, commit_sha, "compliance_rules", "running", started_at=datetime.utcnow())
        evidence_records = []
        try:
            update_analysis_status(
                db=db, snapshot_id=snapshot_id, commit_sha=commit_sha,
                status="RUNNING_RULES", current_stage="Running code compliance rules",
                progress=40, completed_stages=completed_steps
            )
            evidence_engine = EvidenceEngine()
            symbols = symbol_indexer.get_all_symbols()
            security_findings = security_engine.get_all_findings()
            
            evidence_records = evidence_engine.analyze_repository(
                symbols=symbols,
                dependencies=dependencies,
                security_findings=security_findings,
                file_imports=file_imports
            )
            completed_steps.append("Compliance Rules Applied")
            t_mod_end = time.perf_counter()
            update_module_status(
                db=db, commit_sha=commit_sha, module_name="compliance_rules",
                status="completed", finished_at=datetime.utcnow(),
                duration_seconds=t_mod_end - t_mod_start
            )
        except Exception as e:
            logger.exception("[Intel] Compliance rules failed")
            t_mod_end = time.perf_counter()
            update_module_status(
                db=db, commit_sha=commit_sha, module_name="compliance_rules",
                status="failed", finished_at=datetime.utcnow(),
                duration_seconds=t_mod_end - t_mod_start, error_message=str(e)
            )

        # -------------------------------------------------------------
        # Module 5: Architecture Mapping
        # -------------------------------------------------------------
        t_mod_start = time.perf_counter()
        update_module_status(db, commit_sha, "architecture_mapping", "running", started_at=datetime.utcnow())
        layers = {}
        try:
            update_analysis_status(
                db=db, snapshot_id=snapshot_id, commit_sha=commit_sha,
                status="BUILDING_ARCHITECTURE", current_stage="Inferring layer architecture",
                progress=50, completed_stages=completed_steps
            )
            architecture_engine = ArchitectureEngine()
            layers = architecture_engine.analyze(evidence_records, files_list)
            completed_steps.append("Architecture Mapped")
            t_mod_end = time.perf_counter()
            update_module_status(
                db=db, commit_sha=commit_sha, module_name="architecture_mapping",
                status="completed", finished_at=datetime.utcnow(),
                duration_seconds=t_mod_end - t_mod_start
            )
        except Exception as e:
            logger.exception("[Intel] Architecture mapping failed")
            t_mod_end = time.perf_counter()
            update_module_status(
                db=db, commit_sha=commit_sha, module_name="architecture_mapping",
                status="failed", finished_at=datetime.utcnow(),
                duration_seconds=t_mod_end - t_mod_start, error_message=str(e)
            )

        # -------------------------------------------------------------
        # Module 6: Complexity Metrics
        # -------------------------------------------------------------
        t_mod_start = time.perf_counter()
        update_module_status(db, commit_sha, "complexity_metrics", "running", started_at=datetime.utcnow())
        file_metrics = {}
        health_scores = {}
        try:
            update_analysis_status(
                db=db, snapshot_id=snapshot_id, commit_sha=commit_sha,
                status="CALCULATING_METRICS", current_stage="Calculating complexity metrics",
                progress=70, completed_stages=completed_steps
            )
            
            metrics_engine = MetricsEngine()
            for fpath in files_list:
                content = source_files_content.get(fpath, "")
                f_symbols = symbol_indexer.get_file_symbols(fpath)
                f_security = security_engine.get_findings_for_file(fpath)
                imports_count = sum(1 for target, imps in file_imports.items() if any(fpath in imp or fpath.split("/")[-1].split(".")[0] in imp for imp in imps))
                
                has_test = any(t in fpath.lower() for t in ("test_", "_test", "spec"))
                has_test_file = False
                if not has_test:
                    basename = fpath.split("/")[-1].split(".")[0]
                    has_test_file = any(basename in tf.lower() and tf != fpath for tf in files_list if any(t in tf.lower() for t in ("test_", "_test", "spec")))

                # Fetch pre-parsed complexity metrics to avoid double parsing
                parser = file_parsers.get(fpath)
                precalc = None
                if parser:
                    try:
                        precalc = parser.get_complexity_metrics()
                    except Exception:
                        pass

                file_metrics[fpath] = metrics_engine.calculate_file_metrics(
                    file_path=fpath,
                    content=content,
                    symbols=f_symbols,
                    imports_count=imports_count,
                    security_findings=f_security,
                    has_test_file=has_test_file,
                    precalculated_complexity=precalc
                )

            health_engine = HealthEngine()
            health_scores = health_engine.calculate_health(
                files=files_list,
                dependencies=dependencies,
                security_findings=security_engine.get_all_findings(),
                file_metrics=file_metrics
            )
            completed_steps.append("Metrics and Health Compiled")
            t_mod_end = time.perf_counter()
            update_module_status(
                db=db, commit_sha=commit_sha, module_name="complexity_metrics",
                status="completed", finished_at=datetime.utcnow(),
                duration_seconds=t_mod_end - t_mod_start, files_processed=len(files_list)
            )
        except Exception as e:
            logger.exception("[Intel] Complexity metrics failed")
            t_mod_end = time.perf_counter()
            update_module_status(
                db=db, commit_sha=commit_sha, module_name="complexity_metrics",
                status="failed", finished_at=datetime.utcnow(),
                duration_seconds=t_mod_end - t_mod_start, error_message=str(e)
            )

        # -------------------------------------------------------------
        # Module 7: Semantic Graphs
        # -------------------------------------------------------------
        t_mod_start = time.perf_counter()
        update_module_status(db, commit_sha, "semantic_graphs", "running", started_at=datetime.utcnow())
        recommendation_records = []
        arch_graph = {}
        dep_graph = {}
        call_graph = {}
        tech_graph = {}
        repo_tree = []
        try:
            update_analysis_status(
                db=db, snapshot_id=snapshot_id, commit_sha=commit_sha,
                status="BUILDING_GRAPHS", current_stage="Building dependency graphs",
                progress=85, completed_stages=completed_steps
            )
            recommendation_engine = RecommendationEngine()
            recommendation_records = recommendation_engine.generate_recommendations(evidence_records)

            arch_builder = ArchitectureGraphBuilder()
            arch_builder.build(layers)
            arch_graph = arch_builder.serialize()

            dep_builder = DependencyGraphBuilder()
            from intelligence.utils import get_repository_name
            repo_display_name = get_repository_name(snapshot.repository)
            dep_builder.build(dependencies, repo_display_name)
            dep_graph = dep_builder.serialize()

            call_builder = CallGraphBuilder()
            call_builder.build(file_imports, files_list)
            call_graph = call_builder.serialize()

            techs_list = list({t for l in layers.values() for t in l["techs"]})
            tech_builder = TechnologyGraphBuilder()
            tech_builder.build(techs_list)
            tech_graph = tech_builder.serialize()

            repo_tree = _build_hierarchical_tree(files_list, file_metrics)
            completed_steps.append("Semantic Graphs Created")
            t_mod_end = time.perf_counter()
            update_module_status(
                db=db, commit_sha=commit_sha, module_name="semantic_graphs",
                status="completed", finished_at=datetime.utcnow(),
                duration_seconds=t_mod_end - t_mod_start
            )
        except Exception as e:
            logger.exception("[Intel] Semantic graphs generation failed")
            t_mod_end = time.perf_counter()
            update_module_status(
                db=db, commit_sha=commit_sha, module_name="semantic_graphs",
                status="failed", finished_at=datetime.utcnow(),
                duration_seconds=t_mod_end - t_mod_start, error_message=str(e)
            )

        # -------------------------------------------------------------
        # Finalization & Writing Cache
        # -------------------------------------------------------------
        update_analysis_status(
            db=db,
            snapshot_id=snapshot_id,
            commit_sha=commit_sha,
            status="WRITING_CACHE",
            current_stage="Writing analysis cache",
            progress=95,
            completed_stages=completed_steps
        )
        symbols = symbol_indexer.get_all_symbols()
        analysis_output = {
            "repository_snapshot_id": snapshot_id,
            "repository_tree": repo_tree,
            "architecture_graph": arch_graph,
            "dependency_graph": dep_graph,
            "technology_graph": tech_graph,
            "call_graph": call_graph,
            "metrics": file_metrics,
            "health": health_scores,
            "evidence": [ev.model_dump() for ev in evidence_records],
            "recommendations": [rec.model_dump() for rec in recommendation_records],
            "symbols": [sym.model_dump() for sym in symbols]
        }

        # Safe cache writes
        try:
            RepositoryAnalysisCache.set(commit_sha, snapshot_id, analysis_output, db)
        except Exception as cache_exc:
            logger.exception(f"[Intel] Failed writing results to analysis cache: {cache_exc}")

        # Safe DB sync
        try:
            _sync_database_records(
                db=db,
                evaluation=evaluation,
                evidence_list=analysis_output["evidence"],
                recommendation_list=analysis_output["recommendations"]
            )
        except Exception as db_sync_exc:
            logger.exception(f"[Intel] Failed to sync database records for evaluation: {db_sync_exc}")

        completed_steps.append("Cache Finalised")

        t_end = time.perf_counter()
        duration = t_end - t_start
        update_analysis_status(
            db=db,
            snapshot_id=snapshot_id,
            commit_sha=commit_sha,
            status="COMPLETED",
            current_stage="Analysis complete",
            progress=100,
            completed_stages=completed_steps,
            ended_at=datetime.utcnow(),
            duration=duration
        )
        logger.info("[Intel] Static analysis completed in %.2f seconds for commit=%s", duration, commit_sha)
        return analysis_output
        
    except Exception as e:
        logger.exception("[Intel] Static analysis crashed for commit=%s: %s", commit_sha, e)
        t_end = time.perf_counter()
        update_analysis_status(
            db=db,
            snapshot_id=snapshot_id,
            commit_sha=commit_sha,
            status="FAILED",
            current_stage="Failed",
            progress=100,
            error_message=str(e),
            ended_at=datetime.utcnow(),
            duration=t_end - t_start
        )
        raise e

def _build_hierarchical_tree(files: List[str], file_metrics: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Builds a nested folder tree JSON representation from flat path lists."""
    root = {"name": "root", "type": "dir", "children": {}}
    
    for fpath in files:
        parts = fpath.split("/")
        current = root
        for idx, part in enumerate(parts):
            if idx == len(parts) - 1:
                # File node
                metrics = file_metrics.get(fpath, {})
                current["children"][part] = {
                    "name": part,
                    "path": fpath,
                    "type": "file",
                    "language": fpath.split(".")[-1] if "." in fpath else "unknown",
                    "extension": "." + fpath.split(".")[-1] if "." in fpath else None,
                    "size": metrics.get("size_bytes", 0),
                    "loc": metrics.get("loc", 0),
                    "sha256": hashlib.sha256(fpath.encode()).hexdigest()[:16],
                    "roles": metrics.get("roles", {"Unknown": 1.0}),
                    "generated": "node_modules" in fpath or "build" in fpath or "dist" in fpath,
                    "ignored": False
                }
            else:
                # Directory node
                if part not in current["children"]:
                    current["children"][part] = {
                        "name": part,
                        "path": "/".join(parts[:idx+1]),
                        "type": "dir",
                        "children": {}
                    }
                current = current["children"][part]

    # Convert dictionaries to lists recursively
    def dict_to_list(node):
        if "children" in node:
            node["children"] = [dict_to_list(child) for child in node["children"].values()]
        return node

    tree_list = [dict_to_list(child) for child in root["children"].values()]
    return tree_list

def _load_source_contents_from_github_cache(github_url: str) -> Dict[str, str]:
    """Loads sampled file contents from github_tool cached json dictionary."""
    from tools.github_tool import _cache_path
    from tools.github_tool import _repo_name_from_url
    
    contents = {}
    try:
        repo_name = _repo_name_from_url(github_url)
        path = _cache_path(repo_name)
        if path.exists():
            payload = json.loads(path.read_text(encoding="utf-8"))
            data = payload.get("data", {})
            for item in data.get("source_files", []):
                contents[item["path"]] = item.get("content", "")
            for item in data.get("python_files", []):
                contents[item["path"]] = item.get("content", "")
            # Include dependencies text if available
            for dpath, dcontent in data.get("dependencies", {}).items():
                contents[dpath] = dcontent
    except Exception:
        pass
    return contents

import uuid

def _sync_database_records(
    db: Session,
    evaluation: Any,
    evidence_list: List[Dict[str, Any]],
    recommendation_list: List[Dict[str, Any]]
) -> None:
    """Saves analyzed evidence and recommendations into the DB for compatibility using merge() (idempotent)."""
    try:
        # Clear existing evidence and recommendations linked to this evaluation
        db.query(Evidence).filter(Evidence.evaluation_id == evaluation.evaluation_id).delete()
        db.query(Recommendation).filter(Recommendation.evaluation_id == evaluation.evaluation_id).delete()
        db.commit()

        # Insert new Evidence records using merge() with deterministic IDs
        for ev in evidence_list[:100]: # Limit for performance
            evidence_key = f"{evaluation.evaluation_id}:{ev['rule_id']}:{ev['file_path']}:{ev['line_start']}"
            evidence_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, evidence_key))
            
            db.merge(Evidence(
                id=evidence_id,
                evaluation_id=evaluation.evaluation_id,
                category=ev["rule_id"].replace("RULE_", "").split("_")[0],
                finding=f"[{ev['rule_id']}] Detected in {ev['file_path']} at line {ev['line_start']}",
                file_path=ev["file_path"],
                line_start=ev["line_start"],
                line_end=ev["line_end"],
                confidence=ev["confidence"]
            ))

        # Insert new Recommendations using merge()
        for rec in recommendation_list[:25]:
            db.merge(Recommendation(
                id=rec["id"],
                evaluation_id=evaluation.evaluation_id,
                evidence_id=None,
                category=rec["triggered_rule_ids"][0] if rec["triggered_rule_ids"] else "GENERAL",
                recommendation=rec["recommendation"],
                priority=rec["severity"] if rec.get("severity") in ("CRITICAL", "HIGH", "MEDIUM", "LOW") else "MEDIUM",
                status="Pending"
            ))
        db.commit()
    except Exception as e:
        db.rollback()
        logger.exception("[Intel] Failed to sync database records for evaluation=%s: %s", evaluation.evaluation_id, e)
