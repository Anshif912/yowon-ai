from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class DecisionPolicyBase(BaseModel):
    name: str
    min_documentation_score: float = 0.60
    min_security_score: float = 0.70
    min_testing_score: float = 0.50
    min_innovation_score: float = 0.30
    max_similarity_threshold: float = 0.85
    version: int = 1

class DecisionPolicyResponse(DecisionPolicyBase):
    uuid: str
    workspace_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DecisionSnapshotResponse(BaseModel):
    uuid: str
    project_id: str
    version: int
    overall_score: float
    engineering_score: float
    security_score: float
    architecture_score: float
    innovation_score: float
    business_score: float
    deployment_score: float
    maintainability_score: float
    
    overall_confidence: float
    agent_confidence: float
    dna_confidence: float
    evidence_confidence: float
    policy_confidence: float
    
    lifecycle_status: str
    verdict: str
    
    repository_snapshot_id: Optional[str] = None
    dna_snapshot_id: Optional[str] = None
    similarity_policy_version: Optional[int] = None
    decision_policy_version: Optional[int] = None
    agent_versions_json: Optional[str] = None
    llm_model_version: Optional[str] = None
    evaluation_version: Optional[str] = None
    workspace_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class DecisionRegistryResponse(BaseModel):
    uuid: str
    project_id: str
    latest_snapshot_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DecisionEvidenceResponse(BaseModel):
    uuid: str
    project_id: str
    dimension: str
    evidence_type: str
    description: str
    confidence: float
    reference_uri: Optional[str] = None
    severity: str
    created_at: datetime

    class Config:
        from_attributes = True

class RecommendationResponse(BaseModel):
    uuid: str
    project_id: str
    version: int
    category: str
    title: str
    description: str
    priority: str
    impact: str
    estimated_effort: Optional[str] = None
    business_value: Optional[str] = None
    technical_value: Optional[str] = None
    suggested_owner: Optional[str] = None
    status: str
    source_ids_json: Optional[str] = None
    dependencies_json: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectRiskResponse(BaseModel):
    uuid: str
    project_id: str
    risk_type: str
    severity: str
    likelihood: str
    impact_description: str
    mitigation_strategy: str
    evidence_reference: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SimulationBase(BaseModel):
    inputs_json: str

class SimulationResponse(SimulationBase):
    uuid: str
    project_id: str
    predicted_score: float
    actual_outcome_score: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

class MaturityResponse(BaseModel):
    engineering: float
    security: float
    deployment: float
    innovation: float
    documentation: float
    ai: float
    governance: float
    compliance: float
    overall: float

class PortfolioIntelligenceResponse(BaseModel):
    workspace_id: str
    total_projects: int
    average_quality_score: float
    average_security_score: float
    average_innovation_score: float
    technical_debt_estimate: float
    risk_distribution: Dict[str, int]
    maturity_metrics: MaturityResponse

class ExecutiveDashboardResponse(BaseModel):
    total_projects_approved: int
    total_projects_at_risk: int
    average_similarity_percent: float
    governance_sla_days: float
    reviewer_throughput_weekly: int
    portfolio: PortfolioIntelligenceResponse

class AssistantQueryRequest(BaseModel):
    query: str
    project_id: Optional[str] = None
    workspace_id: Optional[str] = None

class AssistantQueryResponse(BaseModel):
    response: str
    referenced_evidence_ids: List[str]
    suggested_actions: List[str]

class DecisionPackageResponse(BaseModel):
    decision: DecisionSnapshotResponse
    evidence: List[DecisionEvidenceResponse]
    recommendations: List[RecommendationResponse]
    risks: List[ProjectRiskResponse]
    policies: List[DecisionPolicyResponse]
    timeline: List[Dict[str, Any]]
