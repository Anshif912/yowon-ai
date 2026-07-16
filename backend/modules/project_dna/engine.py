import json
import logging
import uuid
import time
from datetime import datetime
from typing import Dict, Any, List, Optional, Set
from sqlalchemy.orm import Session

from database import (
    RepositorySnapshot,
    ProjectDNASnapshot,
    ProjectDNAFeature,
    ProjectDNAFingerprint,
    SimilarityPolicy,
)
from modules.project_dna.extractors import EXTRACTOR_PIPELINE
from modules.project_dna.fingerprints import generate_dimension_hash

logger = logging.getLogger(__name__)

# Map path patterns/extensions to extractors for incremental DNA updates
DIMENSION_FILE_MAP = {
    "Deployment": ["dockerfile", "docker-compose", "k8s", ".tf"],
    "Workflow": [".github/workflows", "gitlab-ci", "jenkins"],
    "Documentation": [".md", ".txt", "docs/", "wiki/"],
    "API": ["router", "controller", "endpoint"],
    "AI": ["prompt", "agent", "llm", "rag", "chain"],
    "Security": [".env", "auth", "secret", "token"],
}

class ExtractorRegistry:
    """Enterprise Extractor Registry allowing pluggable extensions to register dynamically."""
    def __init__(self):
        self._registry = {}

    def register(self, extractor_cls):
        self._registry[extractor_cls.name] = extractor_cls
        logger.info("[ExtractorRegistry] Registered %s v%s", extractor_cls.name, extractor_cls.version)

    def get_pipeline(self) -> List[Any]:
        """Pipeline Builder returning sorted list of registered extractors by execution priority."""
        return sorted(self._registry.values(), key=lambda x: x.priority)

# Initialize registry and register all core pipeline extractors
extractor_registry = ExtractorRegistry()
for ext in EXTRACTOR_PIPELINE:
    extractor_registry.register(ext)


def load_ignore_rules(db: Session, workspace_id: Optional[str] = None) -> List[str]:
    """Loads ignore patterns from similarity policy database."""
    policy = db.query(SimilarityPolicy).filter(SimilarityPolicy.workspace_id == workspace_id).first()
    if not policy:
        policy = db.query(SimilarityPolicy).filter(SimilarityPolicy.workspace_id == None).first()
        
    if policy and policy.ignored_paths:
        try:
            return json.loads(policy.ignored_paths)
        except Exception:
            pass
            
    return ["node_modules", "venv", ".git", "build", "dist", "target", "logs", "__pycache__", "coverage", ".idea", ".vscode"]


def is_path_ignored(filepath: str, ignore_rules: List[str]) -> bool:
    """Checks if a file path matches any ignore patterns."""
    path_lower = filepath.lower()
    for rule in ignore_rules:
        if rule.lower() in path_lower:
            return True
    return False


def determine_dirty_extractors(changed_files: List[str]) -> Set[str]:
    """Determines which dimensions need regeneration based on changed files."""
    dirty = set()
    for f in changed_files:
        f_lower = f.lower()
        matched = False
        for dim, patterns in DIMENSION_FILE_MAP.items():
            for p in patterns:
                if p in f_lower:
                    dirty.add(dim)
                    matched = True
                    break
        if not matched and f_lower.endswith((".py", ".js", ".ts", ".go", ".java")):
            dirty.update(["Architecture", "Technology", "Dependency", "API", "AI", "Security", "Metrics"])
    return dirty


def generate_project_dna(db: Session, project_id: str, snapshot: RepositorySnapshot, changed_files: List[str] = None) -> ProjectDNASnapshot:
    """
    Main entry point for DNA pipeline extraction.
    Creates an immutable ProjectDNASnapshot, runs extractors registry,
    persists features and fingerprints.
    """
    logger.info("[DNA Engine] Starting DNA generation for project=%s snapshot=%s", project_id, snapshot.snapshot_id)
    
    # 0. DNA Cache: Checks if a completed DNA snapshot already exists for this snapshot_id
    cached_dna = db.query(ProjectDNASnapshot).filter(
        ProjectDNASnapshot.project_id == project_id,
        ProjectDNASnapshot.repository_snapshot_id == snapshot.snapshot_id,
        ProjectDNASnapshot.status == "COMPLETED"
    ).first()
    if cached_dna:
        logger.info("[DNA Engine] DNA Cache Hit. Returning cached snapshot=%s", cached_dna.uuid)
        return cached_dna

    # 1. Fetch previous DNA snapshot for incremental comparison
    prev_snapshot = db.query(ProjectDNASnapshot).filter(
        ProjectDNASnapshot.project_id == project_id,
        ProjectDNASnapshot.status == "COMPLETED"
    ).order_by(ProjectDNASnapshot.created_at.desc()).first()
    
    version_num = 1
    if prev_snapshot:
        try:
            version_num = int(prev_snapshot.version.replace("v", "")) + 1
        except Exception:
            version_num = 2
            
    version_str = f"v{version_num}"
    
    # Create enqueued snapshot
    dna_snap = ProjectDNASnapshot(
        uuid=str(uuid.uuid4()),
        project_id=project_id,
        repository_snapshot_id=snapshot.snapshot_id,
        version=version_str,
        status="PARSING",
        health="Healthy"
    )
    db.add(dna_snap)
    db.commit()
    
    ignore_rules = load_ignore_rules(db)
    
    # Determine which extractors to execute if incremental support is possible
    dirty_extractors = set()
    is_incremental = False
    if prev_snapshot and changed_files:
        dirty_extractors = determine_dirty_extractors(changed_files)
        is_incremental = True
        logger.info("[DNA Engine] Incremental update. Dirty dimensions: %s", dirty_extractors)
        
    dna_snap.status = "EXTRACTING"
    db.commit()
    
    extraction_report = {}
    
    # Build dynamic pipeline list from Registry
    active_pipeline = extractor_registry.get_pipeline()
    
    # DNA Manifest: record generation metadata for audit trails
    dna_manifest = {
        "engine_version": "1.0",
        "fingerprint_algorithm_version": "v1",
        "ignored_patterns": ignore_rules,
        "is_incremental": is_incremental,
        "extractors_used": {ext.name: ext.version for ext in active_pipeline}
    }
    
    # Pipeline execution loop
    for extractor_class in active_pipeline:
        ext = extractor_class()
        
        # Skip if incremental and this extractor is clean
        if is_incremental and ext.name not in dirty_extractors:
            # Copy features from previous snapshot
            prev_features = db.query(ProjectDNAFeature).filter(
                ProjectDNAFeature.dna_snapshot_id == prev_snapshot.uuid,
                ProjectDNAFeature.dimension == ext.name
            ).all()
            for pf in prev_features:
                db.add(ProjectDNAFeature(
                    uuid=str(uuid.uuid4()),
                    dna_snapshot_id=dna_snap.uuid,
                    dimension=pf.dimension,
                    feature_type=pf.feature_type,
                    feature_name=pf.feature_name,
                    value=pf.value,
                    confidence=pf.confidence
                ))
            extraction_report[ext.name] = "copied_incremental"
            continue
            
        start_time = time.time()
        try:
            # Execute extractor
            payload = ext.extract(db, snapshot, changed_files)
            duration = round((time.time() - start_time) * 1000, 2)  # ms
            
            # Save feature dimensions
            for key, val in payload.items():
                if isinstance(val, (list, dict)):
                    val_str = json.dumps(val)
                else:
                    val_str = str(val)
                    
                db.add(ProjectDNAFeature(
                    uuid=str(uuid.uuid4()),
                    dna_snapshot_id=dna_snap.uuid,
                    dimension=ext.name,
                    feature_type=key,
                    feature_name=key,
                    value=val_str,
                    confidence=1.0
                ))
                
            extraction_report[ext.name] = {"status": "ok", "duration_ms": duration}
        except Exception as e:
            logger.exception("[DNA Engine] Extractor %s failed: %s", ext.name, e)
            extraction_report[ext.name] = {"status": "failed", "error": str(e)}
            dna_snap.health = "Partial"
            
    dna_snap.extraction_report = json.dumps(extraction_report)
    dna_snap.dna_manifest = json.dumps(dna_manifest)
    dna_snap.status = "GENERATING"
    db.commit()
    
    # 3. Generate and save fingerprints
    dna_snap.status = "COMPLETED"
    db.commit()
    
    # Generate fingerprints entry
    fingerprint_entry = ProjectDNAFingerprint(
        uuid=str(uuid.uuid4()),
        dna_snapshot_id=dna_snap.uuid,
        fingerprint_algorithm_version="v1"
    )
    
    # Calculate hashes per dimension
    for ext_class in active_pipeline:
        ext_name = ext_class.name
        features = db.query(ProjectDNAFeature).filter(
            ProjectDNAFeature.dna_snapshot_id == dna_snap.uuid,
            ProjectDNAFeature.dimension == ext_name
        ).all()
        
        feature_dict = {f.feature_name: f.value for f in features}
        h = generate_dimension_hash(ext_name, feature_dict)
        
        attr_name = f"{ext_name.lower() if ext_name != 'Repository' else 'repository'}_hash"
        if hasattr(fingerprint_entry, attr_name):
            setattr(fingerprint_entry, attr_name, h)
            
    db.add(fingerprint_entry)
    db.commit()
    
    logger.info("[DNA Engine] Successfully completed DNA snapshot=%s version=%s", dna_snap.uuid, version_str)
    return dna_snap
