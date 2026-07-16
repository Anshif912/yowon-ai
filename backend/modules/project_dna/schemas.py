from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class SimilarityPolicyBase(BaseModel):
    name: str
    weight_architecture: float = 0.30
    weight_technology: float = 0.15
    weight_workflow: float = 0.20
    weight_api: float = 0.10
    weight_security: float = 0.10
    weight_repository: float = 0.05
    weight_deployment: float = 0.05
    weight_documentation: float = 0.05
    threshold_high_similarity: float = 0.85
    ignored_paths: Optional[List[str]] = None
    ignored_extensions: Optional[List[str]] = None
    version: int = 1

import json
from pydantic import field_validator

class SimilarityPolicyResponse(SimilarityPolicyBase):
    uuid: str
    workspace_id: Optional[str] = None
    created_at: datetime

    @field_validator("ignored_paths", "ignored_extensions", mode="before")
    @classmethod
    def parse_json_string(cls, v: Any) -> Optional[List[str]]:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [v]
        return v

    class Config:
        from_attributes = True

class DNASnapshotResponse(BaseModel):
    uuid: str
    project_id: str
    repository_snapshot_id: Optional[str] = None
    version: str
    status: str
    health: str
    extraction_report: Optional[Dict[str, Any]] = None
    dna_manifest: Optional[Dict[str, Any]] = None
    
    overall_confidence: float
    repository_confidence: float
    architecture_confidence: float
    technology_confidence: float
    dependency_confidence: float
    api_confidence: float
    ai_confidence: float
    security_confidence: float
    workflow_confidence: float
    deployment_confidence: float
    documentation_confidence: float
    metrics_confidence: float
    created_at: datetime

    class Config:
        from_attributes = True

class DNAFeatureResponse(BaseModel):
    uuid: str
    dna_snapshot_id: str
    dimension: str
    feature_type: str
    feature_name: str
    value: Optional[str] = None
    confidence: float
    created_at: datetime

    class Config:
        from_attributes = True

class DNAFingerprintResponse(BaseModel):
    uuid: str
    dna_snapshot_id: str
    fingerprint_algorithm_version: str
    architecture_hash: Optional[str] = None
    technology_hash: Optional[str] = None
    dependency_hash: Optional[str] = None
    workflow_hash: Optional[str] = None
    repository_hash: Optional[str] = None
    api_hash: Optional[str] = None
    deployment_hash: Optional[str] = None
    documentation_hash: Optional[str] = None
    security_hash: Optional[str] = None
    ai_hash: Optional[str] = None

    class Config:
        from_attributes = True

class ComparisonEvidenceResponse(BaseModel):
    uuid: str
    session_id: str
    dimension: str
    evidence_type: str
    description: str
    confidence: float
    reference_uri: Optional[str] = None
    severity: str

    class Config:
        from_attributes = True

class ComparisonSessionResponse(BaseModel):
    uuid: str
    workspace_id: str
    user_id: str
    source_project_id: str
    target_project_id: str
    source_dna_snapshot_id: str
    target_dna_snapshot_id: str
    
    overall_similarity: Optional[float] = None
    confidence: Optional[float] = None
    risk_level: Optional[str] = None
    recommendation: Optional[str] = None
    ai_summary: Optional[str] = None
    
    reviewer_decision: str
    reviewer_comment: Optional[str] = None
    assigned_reviewer_id: Optional[str] = None
    status: str
    created_at: datetime
    evidences: List[ComparisonEvidenceResponse] = []

    class Config:
        from_attributes = True

class SimilarityMatrixResponse(BaseModel):
    project_ids: List[str]
    project_names: List[str]
    matrix: List[List[float]]

class DNAEvolutionResponse(BaseModel):
    project_id: str
    snapshots: List[DNASnapshotResponse]
    architecture_evolution: List[Dict[str, Any]]
    technology_evolution: List[Dict[str, Any]]
    metrics_timeline: List[Dict[str, Any]]

class DNAComparisonDiffResponse(BaseModel):
    added_features: List[Dict[str, Any]]
    removed_features: List[Dict[str, Any]]
    modified_features: List[Dict[str, Any]]

class DNADriftResponse(BaseModel):
    from_version: str
    to_version: str
    drift_score: float
    risk_score: float
    drifted_dimensions: List[str]
    impact_level: str  # LOW | MEDIUM | HIGH

class DNAGraphResponse(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
