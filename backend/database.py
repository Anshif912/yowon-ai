"""
database.py — SQLAlchemy setup and normalized schemas for YOWON AI.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    Boolean,
    UniqueConstraint,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, Session, relationship, sessionmaker

from config import DATABASE_URL


# ── Engine & Session factory ──────────────────────────────────────────────────
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Base model ────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Models ────────────────────────────────────────────────────────────────────

class Organization(Base):
    """Represents an enterprise organization."""

    __tablename__ = "organizations"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: str = Column(String(255), nullable=False)
    slug: str = Column(String(255), nullable=False, unique=True, index=True)
    description: Optional[str] = Column(Text, nullable=True)
    industry: Optional[str] = Column(String(100), nullable=True)
    logo_url: Optional[str] = Column(String(512), nullable=True)
    website_url: Optional[str] = Column(String(512), nullable=True)
    country: Optional[str] = Column(String(100), nullable=True)
    parent_org_id: Optional[str] = Column(String(36), ForeignKey("organizations.uuid"), nullable=True)
    owner_id: str = Column(String(36), ForeignKey("users.uuid"), nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    deleted_at: Optional[datetime] = Column(DateTime, nullable=True)
    deleted_by: Optional[str] = Column(String(36), nullable=True)


class OrganizationMember(Base):
    """Represents organization membership and roles."""

    __tablename__ = "organization_members"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id: str = Column(String(36), ForeignKey("organizations.uuid"), nullable=False, index=True)
    user_id: str = Column(String(36), ForeignKey("users.uuid"), nullable=False, index=True)
    role: str = Column(String(50), default="member")  # owner | admin | member
    joined_at: datetime = Column(DateTime, default=datetime.utcnow)


class Workspace(Base):
    """Represents an organization or team workspace."""

    __tablename__ = "workspaces"

    workspace_id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    organization_id: Optional[str] = Column(String(36), ForeignKey("organizations.uuid"), nullable=True, index=True)
    name: str = Column(String(255), nullable=False)
    description: Optional[str] = Column(Text, nullable=True)
    type: str = Column(String(50), default="PERSONAL")  # PERSONAL | HACKATHON | UNIVERSITY | RESEARCH | COMPANY | STARTUP
    visibility: str = Column(String(50), default="PRIVATE")  # PUBLIC | PRIVATE | INVITE_ONLY
    owner_id: Optional[str] = Column(String(36), ForeignKey("users.uuid"), nullable=True, index=True)
    preferences: Optional[str] = Column(Text, nullable=True)  # JSON-serialized preferences configuration
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    deleted_at: Optional[datetime] = Column(DateTime, nullable=True)
    deleted_by: Optional[str] = Column(String(36), nullable=True)

    projects = relationship("Project", back_populates="workspace", cascade="all, delete-orphan")


class Project(Base):
    """Represents a user-submitted project pending evaluation."""

    __tablename__ = "projects"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Optional[str] = Column(String(36), ForeignKey("workspaces.workspace_id"), nullable=True, index=True)
    team_id: Optional[str] = Column(String(36), ForeignKey("teams.uuid"), nullable=True, index=True)
    name: str = Column(String(255), nullable=False)
    slug: Optional[str] = Column(String(255), nullable=True, index=True)
    project_type: str = Column(String(50), nullable=False, default="Hackathon Project")
    description: Optional[str] = Column(Text, nullable=True)
    github_url: Optional[str] = Column(String(512), nullable=True)
    demo_video_url: Optional[str] = Column(String(512), nullable=True)
    pdf_path: Optional[str] = Column(String(512), nullable=True)
    ppt_path: Optional[str] = Column(String(512), nullable=True)

    # Lifecycle & Registry parameters
    visibility: str = Column(String(50), default="PRIVATE")  # PUBLIC | PRIVATE | INVITE_ONLY
    tags: Optional[str] = Column(Text, nullable=True)  # JSON-serialized list
    category: Optional[str] = Column(String(100), nullable=True)
    repository_url: Optional[str] = Column(String(512), nullable=True)
    default_branch: Optional[str] = Column(String(100), nullable=True)
    readme_snapshot: Optional[str] = Column(Text, nullable=True)
    current_version: str = Column(String(50), default="0.1.0")

    status: str = Column(String(50), default="DRAFT")  # DRAFT | REGISTERED | DEVELOPMENT | EVALUATION_RUNNING | UNDER_REVIEW | APPROVED | PRODUCTION | ARCHIVED
    version: int = Column(Integer, default=1)
    created_by: Optional[str] = Column(String(36), ForeignKey("users.uuid"), nullable=True)
    updated_by: Optional[str] = Column(String(36), ForeignKey("users.uuid"), nullable=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Optional[datetime] = Column(DateTime, nullable=True)

    workspace = relationship("Workspace", back_populates="projects")
    team = relationship("Team")
    creator = relationship("User", foreign_keys=[created_by])
    updator = relationship("User", foreign_keys=[updated_by])
    repositories = relationship("Repository", back_populates="project", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="project", cascade="all, delete-orphan")

    # Workspace OS sub-collections
    versions = relationship("ProjectVersion", back_populates="project", cascade="all, delete-orphan")
    registry_metadata = relationship("ProjectMetadata", back_populates="project", uselist=False, cascade="all, delete-orphan")
    sources = relationship("ProjectSource", back_populates="project", cascade="all, delete-orphan")
    attachments = relationship("ProjectAttachment", back_populates="project", cascade="all, delete-orphan")
    comments = relationship("ProjectComment", back_populates="project", cascade="all, delete-orphan")
    ownership_records = relationship("OwnershipRecord", back_populates="project", cascade="all, delete-orphan")


class Repository(Base):
    """Represents a logical code repository."""

    __tablename__ = "repositories"

    repository_id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    github_repository_id: Optional[str] = Column(String(100), nullable=True)
    github_url: str = Column(String(512), nullable=False)
    owner: Optional[str] = Column(String(255), nullable=True)
    repository_name: Optional[str] = Column(String(255), nullable=True)
    default_branch: Optional[str] = Column(String(100), nullable=True)
    visibility: str = Column(String(50), default="public")
    stars: int = Column(Integer, default=0)
    forks: int = Column(Integer, default=0)
    open_issues: int = Column(Integer, default=0)
    license: Optional[str] = Column(String(100), nullable=True)
    topics: Optional[str] = Column(Text, nullable=True)  # JSON list
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="repositories")
    snapshots = relationship("RepositorySnapshot", back_populates="repository", cascade="all, delete-orphan")
    technologies = relationship("Technology", back_populates="repository", cascade="all, delete-orphan")
    dependencies = relationship("Dependency", back_populates="repository", cascade="all, delete-orphan")


class RepositorySnapshot(Base):
    """Represents the historical state of a repository at a specific commit."""

    __tablename__ = "repository_snapshots"

    snapshot_id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    repository_id: str = Column(String(36), ForeignKey("repositories.repository_id"), nullable=False, index=True)
    commit_sha: str = Column(String(40), nullable=False, index=True)
    tree_sha: Optional[str] = Column(String(40), nullable=True)
    branch: Optional[str] = Column(String(100), nullable=True)
    readme_snapshot: Optional[str] = Column(Text, nullable=True)
    repository_statistics: Optional[str] = Column(Text, nullable=True)  # JSON dict
    folder_structure: Optional[str] = Column(Text, nullable=True)  # JSON list
    technology_summary: Optional[str] = Column(Text, nullable=True)  # JSON dict
    dependency_summary: Optional[str] = Column(Text, nullable=True)  # JSON dict
    architecture_summary: Optional[str] = Column(Text, nullable=True)
    last_commit_timestamp: Optional[datetime] = Column(DateTime, nullable=True)
    snapshot_timestamp: datetime = Column(DateTime, default=datetime.utcnow)
    previous_snapshot_id: Optional[str] = Column(String(36), ForeignKey("repository_snapshots.snapshot_id"), nullable=True)

    repository = relationship("Repository", back_populates="snapshots")
    evaluations = relationship("Evaluation", back_populates="snapshot", cascade="all, delete-orphan")
    previous_snapshot = relationship("RepositorySnapshot", remote_side=[snapshot_id], backref="next_snapshots")
    files = relationship("RepositoryFile", back_populates="snapshot", cascade="all, delete-orphan")
    folders = relationship("RepositoryFolder", back_populates="snapshot", cascade="all, delete-orphan")


class Technology(Base):
    """Represents a technology framework or library used in a repository."""

    __tablename__ = "technologies"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    repository_id: str = Column(String(36), ForeignKey("repositories.repository_id"), nullable=False, index=True)
    name: str = Column(String(100), nullable=False, index=True)
    version: Optional[str] = Column(String(50), nullable=True)

    repository = relationship("Repository", back_populates="technologies")


class Dependency(Base):
    """Represents a code dependency mapped from dependency manifests."""

    __tablename__ = "dependencies"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    repository_id: str = Column(String(36), ForeignKey("repositories.repository_id"), nullable=False, index=True)
    name: str = Column(String(100), nullable=False, index=True)
    version: Optional[str] = Column(String(50), nullable=True)
    type: str = Column(String(50), nullable=False)  # python | npm | maven | go | cargo

    repository = relationship("Repository", back_populates="dependencies")


class RepositoryFile(Base):
    """Represents a file cataloged in a repository snapshot."""

    __tablename__ = "repository_files"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    snapshot_id: str = Column(String(36), ForeignKey("repository_snapshots.snapshot_id"), nullable=False, index=True)
    path: str = Column(String(512), nullable=False)
    size_bytes: int = Column(Integer, default=0)
    language: Optional[str] = Column(String(100), nullable=True)
    symbols_json: Optional[str] = Column(Text, nullable=True)
    imports_json: Optional[str] = Column(Text, nullable=True)
    exports_json: Optional[str] = Column(Text, nullable=True)
    dependencies_json: Optional[str] = Column(Text, nullable=True)
    contributors_json: Optional[str] = Column(Text, nullable=True)
    evaluation_status: Optional[str] = Column(String(50), default="PENDING")
    last_modified: datetime = Column(DateTime, default=datetime.utcnow)

    snapshot = relationship("RepositorySnapshot", back_populates="files")


class RepositoryFolder(Base):
    """Represents a folder cataloged in a repository snapshot."""

    __tablename__ = "repository_folders"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    snapshot_id: str = Column(String(36), ForeignKey("repository_snapshots.snapshot_id"), nullable=False, index=True)
    path: str = Column(String(512), nullable=False)

    snapshot = relationship("RepositorySnapshot", back_populates="folders")


class Evaluation(Base):
    """Represents a single execution run of project calibration."""

    __tablename__ = "evaluations"

    evaluation_id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    repository_snapshot_id: Optional[str] = Column(String(36), ForeignKey("repository_snapshots.snapshot_id"), nullable=True, index=True)
    timestamp: datetime = Column(DateTime, default=datetime.utcnow, index=True)
    evaluation_duration: Optional[float] = Column(Float, nullable=True)
    overall_score: Optional[float] = Column(Float, nullable=True)
    verdict: Optional[str] = Column(String(20), nullable=True)  # ACCEPT | IMPROVE | REJECT
    confidence: Optional[float] = Column(Float, nullable=True)
    evaluation_status: str = Column(String(20), default="Pending")  # Pending | Running | Completed | Failed | Cancelled

    # Explainable AI & Reproducibility parameters
    llm_model: Optional[str] = Column(String(100), nullable=True)
    embedding_model: Optional[str] = Column(String(100), nullable=True)
    evaluation_version: Optional[str] = Column(String(50), nullable=True)
    prompt_version: Optional[str] = Column(String(50), nullable=True)
    rubric_version: Optional[str] = Column(String(50), nullable=True)

    # Extended Versioning & Integrity metadata
    analysis_engine_version: Optional[str] = Column(String(50), nullable=True)
    parser_version: Optional[str] = Column(String(50), nullable=True)
    rule_registry_version: Optional[str] = Column(String(50), nullable=True)
    scoring_version: Optional[str] = Column(String(50), nullable=True)
    evaluation_session_version: Optional[str] = Column(String(50), nullable=True)

    # Snapshot Fingerprint
    repository_fingerprint: Optional[str] = Column(String(64), nullable=True)
    commit_sha: Optional[str] = Column(String(40), nullable=True)
    tree_sha: Optional[str] = Column(String(40), nullable=True)
    default_branch: Optional[str] = Column(String(100), nullable=True)
    repository_hash: Optional[str] = Column(String(64), nullable=True)
    snapshot_timestamp: Optional[datetime] = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="evaluations")
    snapshot = relationship("RepositorySnapshot", back_populates="evaluations")
    agent_evaluations = relationship("AgentEvaluation", back_populates="evaluation", cascade="all, delete-orphan")
    evidences = relationship("Evidence", back_populates="evaluation", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="evaluation", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="evaluation", cascade="all, delete-orphan")
    events = relationship("EvaluationEvent", back_populates="evaluation", cascade="all, delete-orphan")
    provenance = relationship("ScoreProvenance", back_populates="evaluation", cascade="all, delete-orphan")
    stage_timings = relationship("PipelineStageTiming", back_populates="evaluation", cascade="all, delete-orphan")
    prompt_metrics = relationship("AgentPromptMetric", back_populates="evaluation", cascade="all, delete-orphan")
    diagnostics = relationship("PipelineDiagnostic", back_populates="evaluation", cascade="all, delete-orphan")
    audits = relationship("EvaluationAudit", back_populates="evaluation", cascade="all, delete-orphan")


class AgentEvaluation(Base):
    """Stores per-agent evaluation results and timings for a run."""

    __tablename__ = "agent_evaluations"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id: str = Column(String(36), ForeignKey("evaluations.evaluation_id"), nullable=False, index=True)
    agent_name: str = Column(String(100), nullable=False, index=True)  # forge | sentinel | visionary | guardian | showcase
    score: Optional[float] = Column(Float, nullable=True)
    confidence: Optional[float] = Column(Float, nullable=True)
    execution_time: Optional[float] = Column(Float, nullable=True)
    summary: Optional[str] = Column(Text, nullable=True)
    status: str = Column(String(50), default="completed")  # completed | failed

    evaluation = relationship("Evaluation", back_populates="agent_evaluations")


class Evidence(Base):
    """Represents a code intelligence evidence line trace for XAI."""

    __tablename__ = "evidence"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id: str = Column(String(36), ForeignKey("evaluations.evaluation_id"), nullable=False, index=True)
    category: str = Column(String(50), nullable=False)  # IMPLEMENTATION | SECURITY | ARCHITECTURE | DATABASE | API | ML | DEPLOYMENT | TESTING | DOCUMENTATION
    finding: str = Column(Text, nullable=False)
    file_path: Optional[str] = Column(String(512), nullable=True)
    line_start: Optional[int] = Column(Integer, nullable=True)
    line_end: Optional[int] = Column(Integer, nullable=True)
    confidence: Optional[float] = Column(Float, nullable=True)
    severity: Optional[str] = Column(String(50), nullable=True)  # INFO | LOW | MEDIUM | HIGH | CRITICAL

    evaluation = relationship("Evaluation", back_populates="evidences")
    recommendations = relationship("Recommendation", back_populates="evidence", cascade="all, delete-orphan")


class Recommendation(Base):
    """Tracks action items and expected gains."""

    __tablename__ = "recommendations"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id: str = Column(String(36), ForeignKey("evaluations.evaluation_id"), nullable=False, index=True)
    evidence_id: Optional[str] = Column(String(36), ForeignKey("evidence.id"), nullable=True, index=True)
    priority: str = Column(String(20), default="MEDIUM")  # CRITICAL | HIGH | MEDIUM | LOW
    category: Optional[str] = Column(String(100), nullable=True)
    recommendation: str = Column(Text, nullable=False)
    expected_score_gain: Optional[float] = Column(Float, nullable=True)
    estimated_effort: Optional[str] = Column(String(50), nullable=True)
    status: str = Column(String(50), default="Pending")  # Pending | Accepted | Rejected | Implemented | Verified

    evaluation = relationship("Evaluation", back_populates="recommendations")
    evidence = relationship("Evidence", back_populates="recommendations")


class Report(Base):
    """Tracks generated PDF or HTML reports."""

    __tablename__ = "reports"

    report_id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id: str = Column(String(36), ForeignKey("evaluations.evaluation_id"), nullable=False, index=True)
    report_type: str = Column(String(50), default="PDF")
    file_path: Optional[str] = Column(String(512), nullable=True)
    file_size: Optional[int] = Column(Integer, nullable=True)
    checksum: Optional[str] = Column(String(64), nullable=True)
    generated_at: datetime = Column(DateTime, default=datetime.utcnow)
    generation_time: Optional[float] = Column(Float, nullable=True)
    version: str = Column(String(20), default="1.0.0")
    report_status: Optional[str] = Column(String(20), default="ready")
    report_error: Optional[str] = Column(Text, nullable=True)

    evaluation = relationship("Evaluation", back_populates="reports")


class EvaluationEvent(Base):
    """Logs evaluation progress events for pipeline timeline replaying."""

    __tablename__ = "evaluation_events"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id: str = Column(String(36), ForeignKey("evaluations.evaluation_id"), nullable=False, index=True)
    event_name: str = Column(String(100), nullable=False)
    timestamp: datetime = Column(DateTime, default=datetime.utcnow)
    duration: Optional[float] = Column(Float, nullable=True)
    event_metadata: Optional[str] = Column(Text, nullable=True)  # JSON string
    status: str = Column(String(50), default="completed")  # completed | failed

    evaluation = relationship("Evaluation", back_populates="events")


class KnowledgeGraphNode(Base):
    """Represents a node in the repository knowledge graph."""

    __tablename__ = "knowledge_graph_nodes"

    node_id: str = Column(String(100), primary_key=True)
    repository_snapshot_id: str = Column(String(36), ForeignKey("repository_snapshots.snapshot_id"), nullable=False, index=True)
    commit_sha: str = Column(String(40), nullable=False, index=True)
    label: str = Column(String(200), nullable=False)
    type: str = Column(String(50), nullable=False)  # file | class | function | api | model | service | controller | library | env_var | docker_service
    metadata_json: Optional[str] = Column(Text, nullable=True)  # JSON fields: description, metrics, evidence, recommendations, agent_comments, etc.

    snapshot = relationship("RepositorySnapshot")


class KnowledgeGraphEdge(Base):
    """Represents a directed link/edge in the repository knowledge graph."""

    __tablename__ = "knowledge_graph_edges"

    edge_id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    repository_snapshot_id: str = Column(String(36), ForeignKey("repository_snapshots.snapshot_id"), nullable=False, index=True)
    commit_sha: str = Column(String(40), nullable=False, index=True)
    source: str = Column(String(100), nullable=False, index=True)
    target: str = Column(String(100), nullable=False, index=True)
    relation: str = Column(String(50), nullable=False)  # IMPORTS | CALLS | INHERITS | IMPLEMENTS | USES | CONNECTS_TO | DEPENDS_ON | GENERATES

    snapshot = relationship("RepositorySnapshot")


class RepositoryAnalysis(Base):
    """Represents historical static analysis results cache metadata for a snapshot."""

    __tablename__ = "repository_analyses"

    analysis_id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    repository_snapshot_id: str = Column(String(36), ForeignKey("repository_snapshots.snapshot_id"), nullable=False, index=True)
    commit_sha: str = Column(String(40), nullable=False, index=True, unique=True)
    analysis_version: str = Column(String(50), nullable=False)
    engine_version: str = Column(String(50), nullable=False)
    status: str = Column(String(50), default="Pending")  # e.g., QUEUED, Running, Completed, Failed
    current_stage: Optional[str] = Column(String(100), nullable=True)
    progress: int = Column(Integer, default=0)
    started_at: Optional[datetime] = Column(DateTime, nullable=True)
    ended_at: Optional[datetime] = Column(DateTime, nullable=True)
    duration: Optional[float] = Column(Float, nullable=True)
    error_message: Optional[str] = Column(Text, nullable=True)
    completed_stages: Optional[str] = Column(Text, nullable=True)  # JSON-serialized list of stages completed
    files_processed: int = Column(Integer, default=0)
    current_module: Optional[str] = Column(String(100), nullable=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    expires_at: Optional[datetime] = Column(DateTime, nullable=True)

    snapshot = relationship("RepositorySnapshot")


class IntelligenceModuleStatus(Base):
    """Tracks status, timings and stats of individual Repository Intelligence modules."""

    __tablename__ = "intelligence_module_statuses"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: str = Column(String(36), ForeignKey("repository_analyses.analysis_id", ondelete="CASCADE"), nullable=False, index=True)
    module_name: str = Column(String(100), nullable=False)
    status: str = Column(String(20), nullable=False)  # queued | running | completed | failed | skipped
    started_at: Optional[datetime] = Column(DateTime, nullable=True)
    finished_at: Optional[datetime] = Column(DateTime, nullable=True)
    duration_seconds: Optional[float] = Column(Float, nullable=True)
    error_message: Optional[str] = Column(Text, nullable=True)
    cache_hit: bool = Column(Boolean, default=False)
    files_processed: int = Column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint('analysis_id', 'module_name', name='uq_analysis_module'),
    )

    analysis = relationship("RepositoryAnalysis")



class ScoreProvenance(Base):
    __tablename__ = "score_provenance"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id = Column(String(36), ForeignKey("evaluations.evaluation_id"), nullable=False)
    dimension = Column(String(50), nullable=False)
    originating_agent = Column(String(100), nullable=False)
    weight = Column(Float, nullable=False)
    raw_score = Column(Integer, nullable=False)
    calibrated_score = Column(Integer, nullable=False)
    confidence = Column(Float, nullable=False)
    reasoning = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    evaluation = relationship("Evaluation", back_populates="provenance")
    evidence = relationship("ProvenanceEvidence", back_populates="provenance", cascade="all, delete-orphan")


class ProvenanceEvidence(Base):
    __tablename__ = "provenance_evidence"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    provenance_id = Column(String(36), ForeignKey("score_provenance.id"), nullable=False)
    rule_id = Column(String(100), nullable=False)
    file_path = Column(String(512), nullable=True)
    line_start = Column(Integer, nullable=True)
    line_end = Column(Integer, nullable=True)
    confidence = Column(Float, nullable=False)
    
    provenance = relationship("ScoreProvenance", back_populates="evidence")


class PipelineStageTiming(Base):
    __tablename__ = "pipeline_stage_timings"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id = Column(String(36), ForeignKey("evaluations.evaluation_id"), nullable=False)
    stage = Column(String(100), nullable=False)
    started_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=False)
    duration_seconds = Column(Float, nullable=False)
    
    evaluation = relationship("Evaluation", back_populates="stage_timings")


class AgentPromptMetric(Base):
    __tablename__ = "agent_prompt_metrics"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id = Column(String(36), ForeignKey("evaluations.evaluation_id"), nullable=False)
    agent_name = Column(String(100), nullable=False)
    prompt_size_chars = Column(Integer, nullable=False)
    completion_size_chars = Column(Integer, nullable=False)
    latency_seconds = Column(Float, nullable=False)
    
    evaluation = relationship("Evaluation", back_populates="prompt_metrics")


class PipelineDiagnostic(Base):
    __tablename__ = "pipeline_diagnostics"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id = Column(String(36), ForeignKey("evaluations.evaluation_id"), nullable=False)
    files_scanned = Column(Integer, default=0)
    ignored_files = Column(Integer, default=0)
    symbols_indexed = Column(Integer, default=0)
    evidence_count = Column(Integer, default=0)
    graph_nodes = Column(Integer, default=0)
    graph_edges = Column(Integer, default=0)
    cache_hit = Column(Boolean, default=False)
    memory_usage_mb = Column(Float, nullable=True)
    repository_digest = Column(String(64), nullable=True)
    evidence_digest = Column(String(64), nullable=True)
    context_digest = Column(String(64), nullable=True)
    prompt_digest = Column(String(64), nullable=True)
    score_digest = Column(String(64), nullable=True)
    narrative_digest = Column(String(64), nullable=True)
    parsing_error = Column(Text, nullable=True)
    evidence_error = Column(Text, nullable=True)
    graphs_error = Column(Text, nullable=True)
    scoring_error = Column(Text, nullable=True)
    cache_error = Column(Text, nullable=True)
    database_error = Column(Text, nullable=True)
    llm_error = Column(Text, nullable=True)
    subsystem_health_json = Column(Text, nullable=True)
    
    evaluation = relationship("Evaluation", back_populates="diagnostics")


class User(Base):
    """Represents a YOWON AI user account with authentication controls."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(36), default=lambda: str(uuid.uuid4()), unique=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    avatar_url = Column(String(512), nullable=True)
    role = Column(String(50), default="TEAM_MEMBER", nullable=False)  # SUPER_ADMIN | ORG_OWNER | WORKSPACE_ADMIN | JUDGE | REVIEWER | EVALUATOR | PROJECT_OWNER | TEAM_LEADER | TEAM_MEMBER | GUEST
    status = Column(String(50), default="PENDING_VERIFICATION", nullable=False)  # PENDING_VERIFICATION | ACTIVE | SUSPENDED | LOCKED | ARCHIVED
    email_verified = Column(Boolean, default=False, nullable=False)
    
    # Audit & Security tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    account_locked = Column(Boolean, default=False, nullable=False)
    
    # Preferences & Customization
    preferences = Column(Text, nullable=True)  # JSON-serialized string
    timezone = Column(String(100), default="UTC", nullable=False)
    language = Column(String(10), default="en", nullable=False)

    # SSO & MFA Reservations (reserved)
    sso_provider = Column(String(100), nullable=True)
    sso_external_id = Column(String(255), nullable=True)
    mfa_enabled = Column(Boolean, default=False, nullable=False)
    mfa_secret = Column(String(255), nullable=True)
    scim_synced = Column(Boolean, default=False, nullable=False)
    external_subject_id = Column(String(255), nullable=True)
    idp_tenant = Column(String(255), nullable=True)
    provisioning_source = Column(String(50), default="MANUAL", nullable=False)


class Permission(Base):
    """Represents fine-grained RBAC permission limits."""

    __tablename__ = "permissions"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: str = Column(String(100), unique=True, index=True, nullable=False)
    scope: str = Column(String(50), nullable=False)  # GLOBAL | ORGANIZATION | WORKSPACE | PROJECT | EVALUATION
    description: Optional[str] = Column(Text, nullable=True)


class Role(Base):
    """Represents mapped user access role."""

    __tablename__ = "roles"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: str = Column(String(100), unique=True, index=True, nullable=False)
    description: Optional[str] = Column(Text, nullable=True)


class RolePermission(Base):
    """Many-to-many relationship bridging roles and permissions."""

    __tablename__ = "role_permissions"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    role_id: str = Column(String(36), ForeignKey("roles.uuid"), nullable=False)
    permission_id: str = Column(String(36), ForeignKey("permissions.uuid"), nullable=False)


class WorkspaceMember(Base):
    """Represents user membership inside workspaces."""

    __tablename__ = "workspace_members"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: str = Column(String(36), ForeignKey("workspaces.workspace_id"), nullable=False, index=True)
    user_id: str = Column(String(36), ForeignKey("users.uuid"), nullable=False, index=True)
    role: str = Column(String(50), default="TEAM_MEMBER")  # WORKSPACE_ADMIN | TEAM_LEADER | TEAM_MEMBER | GUEST
    status: str = Column(String(50), default="ACCEPTED")  # INVITED | PENDING | ACCEPTED | REJECTED | EXPIRED | REMOVED | SUSPENDED
    joined_at: datetime = Column(DateTime, default=datetime.utcnow)


class WorkspaceInvitation(Base):
    """Represents team/user workspace invitation record."""

    __tablename__ = "workspace_invitations"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: str = Column(String(36), ForeignKey("workspaces.workspace_id"), nullable=False, index=True)
    email: Optional[str] = Column(String(255), nullable=True)
    username: Optional[str] = Column(String(255), nullable=True)
    invite_code: str = Column(String(50), unique=True, index=True, nullable=False)
    role: str = Column(String(50), default="TEAM_MEMBER")
    invited_by: str = Column(String(36), ForeignKey("users.uuid"), nullable=False)
    status: str = Column(String(50), default="PENDING")  # PENDING | ACCEPTED | REJECTED | EXPIRED | CANCELLED
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    expires_at: datetime = Column(DateTime, nullable=False)


class Session(Base):
    """Represents an active authenticated device user session."""

    __tablename__ = "sessions"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: str = Column(String(36), ForeignKey("users.uuid"), nullable=False, index=True)
    device_name: Optional[str] = Column(String(255), nullable=True)
    browser: Optional[str] = Column(String(100), nullable=True)
    os: Optional[str] = Column(String(100), nullable=True)
    ip_address: Optional[str] = Column(String(50), nullable=True)
    token_jti: str = Column(String(255), unique=True, index=True, nullable=False)
    last_active: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_revoked: bool = Column(Boolean, default=False, nullable=False)

    # Session Security Reservations
    last_password_change: Optional[datetime] = Column(DateTime, nullable=True)
    auth_method: Optional[str] = Column(String(50), default="password", nullable=True)
    risk_score: Optional[float] = Column(Float, default=0.0, nullable=True)
    trusted_device: Optional[bool] = Column(Boolean, default=True, nullable=True)


class AuditLog(Base):
    """Represents system operations audit logs registry."""

    __tablename__ = "audit_logs"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id: Optional[str] = Column(String(36), ForeignKey("users.uuid"), nullable=True)
    event_type: str = Column(String(100), nullable=False)  # LOGIN | LOGOUT | CREATE_WORKSPACE | DELETE_WORKSPACE | JOIN_WORKSPACE | CREATE_PROJECT | TRANSFER_OWNERSHIP | ROLE_UPDATED
    target_entity: Optional[str] = Column(String(100), nullable=True)
    previous_values: Optional[str] = Column(Text, nullable=True)
    new_values: Optional[str] = Column(Text, nullable=True)
    correlation_id: str = Column(String(36), nullable=False, index=True)
    ip_address: Optional[str] = Column(String(50), nullable=True)
    user_agent: Optional[str] = Column(String(255), nullable=True)
    timestamp: datetime = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Contextual Log Scope Extensions
    workspace_id: Optional[str] = Column(String(36), nullable=True)
    organization_id: Optional[str] = Column(String(36), nullable=True)


class EvaluationAudit(Base):
    __tablename__ = "evaluation_audits"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id = Column(String(36), ForeignKey("evaluations.evaluation_id"), nullable=False)
    stage = Column(String(100), nullable=False)
    actor = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    details = Column(Text, nullable=True)
    success = Column(Boolean, default=True)
    duration_seconds = Column(Float, nullable=False)
    
    evaluation = relationship("Evaluation", back_populates="audits")


# ── Teams Models ──────────────────────────────────────────────────────────────

class Team(Base):
    """Represents a collaborative team within a workspace."""

    __tablename__ = "teams"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: str = Column(String(36), ForeignKey("workspaces.workspace_id"), nullable=False, index=True)
    name: str = Column(String(255), nullable=False)
    description: Optional[str] = Column(Text, nullable=True)
    avatar_url: Optional[str] = Column(String(512), nullable=True)
    slug: str = Column(String(255), nullable=False, unique=True, index=True)
    team_type: str = Column(String(50), default="DEVELOPMENT")  # DEVELOPMENT | RESEARCH | STARTUP | COLLEGE | COMPANY | OPEN_SOURCE
    status: str = Column(String(50), default="ACTIVE")  # ACTIVE | ARCHIVED | SUSPENDED
    version: int = Column(Integer, default=1)
    created_by: str = Column(String(36), ForeignKey("users.uuid"), nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Optional[datetime] = Column(DateTime, nullable=True)

    workspace = relationship("Workspace")
    creator = relationship("User", foreign_keys=[created_by])
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")


class TeamMember(Base):
    """Represents membership details within a collaborative team."""

    __tablename__ = "team_members"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id: str = Column(String(36), ForeignKey("teams.uuid"), nullable=False, index=True)
    user_id: str = Column(String(36), ForeignKey("users.uuid"), nullable=False, index=True)
    role: str = Column(String(50), default="TEAM_MEMBER")  # Team Owner | Team Lead | Developer | AI Engineer | Researcher | Product Manager | Designer | Business Lead | QA | DevOps | Mentor | Advisor | Viewer
    joined_at: datetime = Column(DateTime, default=datetime.utcnow)
    invitation_source: str = Column(String(50), default="LINK")  # EMAIL | USERNAME | LINK | CODE
    status: str = Column(String(50), default="ACCEPTED")  # INVITED | PENDING | ACCEPTED | REJECTED | SUSPENDED | REMOVED | ARCHIVED
    permission_overrides: Optional[str] = Column(Text, nullable=True)  # JSON-serialized overrides

    team = relationship("Team", back_populates="members")
    user = relationship("User")


class TeamInvitation(Base):
    """Represents team/user invitation record."""

    __tablename__ = "team_invitations"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id: str = Column(String(36), ForeignKey("teams.uuid"), nullable=False, index=True)
    email: Optional[str] = Column(String(255), nullable=True)
    username: Optional[str] = Column(String(255), nullable=True)
    invite_code: str = Column(String(50), unique=True, index=True, nullable=False)
    role: str = Column(String(50), default="TEAM_MEMBER")
    invited_by: str = Column(String(36), ForeignKey("users.uuid"), nullable=False)
    status: str = Column(String(50), default="PENDING")  # PENDING | ACCEPTED | REJECTED | EXPIRED | CANCELLED
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    expires_at: datetime = Column(DateTime, nullable=False)

    team = relationship("Team")
    inviter = relationship("User", foreign_keys=[invited_by])


# ── Enterprise Project Registry Models ────────────────────────────────────────

class ProjectVersion(Base):
    """Represents a version release snapshot of a project."""

    __tablename__ = "project_versions"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    version: str = Column(String(50), nullable=False)  # e.g., "1.0.0"
    tag: Optional[str] = Column(String(100), nullable=True)
    branch: Optional[str] = Column(String(100), nullable=True)
    commit_sha: Optional[str] = Column(String(40), nullable=True)
    snapshot_path: Optional[str] = Column(String(512), nullable=True)
    readme_snapshot: Optional[str] = Column(Text, nullable=True)
    created_by: str = Column(String(36), ForeignKey("users.uuid"), nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="versions")
    creator = relationship("User")


class ProjectMetadata(Base):
    """Stores extracted technologies, language distribution, and repository metrics."""

    __tablename__ = "project_metadata"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True, unique=True)
    languages: Optional[str] = Column(Text, nullable=True)  # JSON-serialized list/dict
    frameworks: Optional[str] = Column(Text, nullable=True)  # JSON-serialized list
    ai_models: Optional[str] = Column(Text, nullable=True)  # JSON-serialized list
    deployment_targets: Optional[str] = Column(Text, nullable=True)  # JSON-serialized list
    database_systems: Optional[str] = Column(Text, nullable=True)  # JSON-serialized list
    cloud_providers: Optional[str] = Column(Text, nullable=True)  # JSON-serialized list
    
    repository_size: int = Column(Integer, default=0)
    file_count: int = Column(Integer, default=0)
    commit_count: int = Column(Integer, default=0)
    contributors: int = Column(Integer, default=1)
    
    # Extended Connection Status metadata
    webhook_enabled: bool = Column(Boolean, default=False)
    last_commit_message: Optional[str] = Column(Text, nullable=True)
    last_sync_at: datetime = Column(DateTime, default=datetime.utcnow)
    extracted_at: datetime = Column(DateTime, default=datetime.utcnow)
    sync_status: str = Column(String(50), default="UP_TO_DATE")  # NEVER_SYNCED | SYNCING | UP_TO_DATE | BEHIND | FAILED | DISCONNECTED
    sync_duration_ms: int = Column(Integer, default=0)
    sync_error_message: Optional[str] = Column(Text, nullable=True)
    last_sync_job_id: Optional[str] = Column(String(36), nullable=True)

    project = relationship("Project", back_populates="registry_metadata")


class ProjectSource(Base):
    """Represents a code repository provider source connect details."""

    __tablename__ = "project_sources"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    source_type: str = Column(String(50), default="GITHUB")  # GITHUB | GITLAB | BITBUCKET | AZURE_DEVOPS | ZIP_UPLOAD | LOCAL_FOLDER
    connection_details: Optional[str] = Column(Text, nullable=True)  # JSON-serialized config parameters
    status: str = Column(String(50), default="CONNECTED")  # CONNECTED | DISCONNECTED | ERROR
    last_sync_at: datetime = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="sources")


class ProjectAttachment(Base):
    """Stores attached documents, demo videos, and pitch decks."""

    __tablename__ = "project_attachments"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    name: str = Column(String(255), nullable=False)
    file_path: str = Column(String(512), nullable=False)
    file_type: str = Column(String(50), default="Document")  # Architecture Diagram | Pitch Deck | Demo Video | Screenshots | Research Paper | Certificates | Documents | Other
    uploaded_by: str = Column(String(36), ForeignKey("users.uuid"), nullable=False)
    uploaded_at: datetime = Column(DateTime, default=datetime.utcnow)
    checksum: Optional[str] = Column(String(64), nullable=True)
    mime_type: Optional[str] = Column(String(100), nullable=True)
    version: int = Column(Integer, default=1)
    size_bytes: int = Column(Integer, default=0)
    download_count: int = Column(Integer, default=0)
    linked_project_version_id: Optional[str] = Column(String(36), nullable=True)
    linked_evaluation_id: Optional[str] = Column(String(36), nullable=True)

    project = relationship("Project", back_populates="attachments")
    uploader = relationship("User")


class ProjectComment(Base):
    """Stores threaded team discussions and annotations on a project."""

    __tablename__ = "project_comments"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    user_id: str = Column(String(36), ForeignKey("users.uuid"), nullable=False, index=True)
    parent_id: Optional[str] = Column(String(36), ForeignKey("project_comments.uuid"), nullable=True)
    content: str = Column(Text, nullable=False)
    is_pinned: bool = Column(Boolean, default=False)
    is_resolved: bool = Column(Boolean, default=False)
    version: int = Column(Integer, default=1)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="comments")
    user = relationship("User")
    replies = relationship("ProjectComment", cascade="all, delete-orphan")


class ProjectCommentRevision(Base):
    """Tracks historical revisions/edits of threaded project discussions."""

    __tablename__ = "project_comment_revisions"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    comment_id: str = Column(String(36), ForeignKey("project_comments.uuid"), nullable=False, index=True)
    content: str = Column(Text, nullable=False)
    edited_at: datetime = Column(DateTime, default=datetime.utcnow)
    revision_number: int = Column(Integer, default=1)

    comment = relationship("ProjectComment")


# ── Enterprise Ownership Engine Models ────────────────────────────────────────

class OwnershipRecord(Base):
    """Represents ownership share registry on a business asset project."""

    __tablename__ = "ownership_records"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    owner_id: Optional[str] = Column(String(36), ForeignKey("users.uuid"), nullable=True, index=True)
    team_id: Optional[str] = Column(String(36), ForeignKey("teams.uuid"), nullable=True, index=True)
    organization_id: Optional[str] = Column(String(36), ForeignKey("organizations.uuid"), nullable=True, index=True)
    ownership_type: str = Column(String(50), default="Individual")  # Individual | Team | Organization | Shared
    ownership_percentage: float = Column(Float, default=100.0)
    verification_status: str = Column(String(50), default="Pending")  # Verified | Pending | Manual Review | Rejected
    joined_date: datetime = Column(DateTime, default=datetime.utcnow)
    source: str = Column(String(100), default="REGISTRATION")  # REGISTRATION | TRANSFER | IMPORT
    notes: Optional[str] = Column(Text, nullable=True)
    version: int = Column(Integer, default=1)

    project = relationship("Project", back_populates="ownership_records")
    owner = relationship("User")
    team = relationship("Team")
    organization = relationship("Organization")


class OwnershipRequest(Base):
    """Represents a claim request for ownership on a registered project."""

    __tablename__ = "ownership_requests"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    user_id: str = Column(String(36), ForeignKey("users.uuid"), nullable=False, index=True)
    reason: str = Column(Text, nullable=False)
    supporting_evidence: Optional[str] = Column(Text, nullable=True)
    status: str = Column(String(50), default="PENDING")  # PENDING | ACCEPTED | DECLINED | CANCELLED
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    resolved_at: Optional[datetime] = Column(DateTime, nullable=True)
    resolved_by: Optional[str] = Column(String(36), ForeignKey("users.uuid"), nullable=True)

    project = relationship("Project")
    user = relationship("User", foreign_keys=[user_id])
    resolver = relationship("User", foreign_keys=[resolved_by])


class OwnershipTransfer(Base):
    """Represents a secure ownership transfer transition."""

    __tablename__ = "ownership_transfers"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    current_owner_id: str = Column(String(36), ForeignKey("users.uuid"), nullable=False, index=True)
    recipient_id: str = Column(String(36), ForeignKey("users.uuid"), nullable=False, index=True)
    status: str = Column(String(50), default="PENDING")  # PENDING | ACCEPTED | DECLINED | CANCELLED
    verification_code: str = Column(String(50), nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    expires_at: datetime = Column(DateTime, nullable=False)
    completed_at: Optional[datetime] = Column(DateTime, nullable=True)

    project = relationship("Project")
    current_owner = relationship("User", foreign_keys=[current_owner_id])
    recipient = relationship("User", foreign_keys=[recipient_id])


class OwnershipReview(Base):
    """Stores manual verification and similarity analysis review cycles."""

    __tablename__ = "ownership_reviews"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    request_id: Optional[str] = Column(String(36), ForeignKey("ownership_requests.uuid"), nullable=True)
    transfer_id: Optional[str] = Column(String(36), ForeignKey("ownership_transfers.uuid"), nullable=True)
    similarity_score: float = Column(Float, default=0.0)
    reviewer_id: Optional[str] = Column(String(36), ForeignKey("users.uuid"), nullable=True)
    status: str = Column(String(50), default="PENDING")  # PENDING | APPROVED | REJECTED | MORE_INFO_REQUESTED | ESCALATED
    notes: Optional[str] = Column(Text, nullable=True)
    evidence_json: Optional[str] = Column(Text, nullable=True)  # JSON-serialized audit metadata
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project")
    reviewer = relationship("User")
    request = relationship("OwnershipRequest")
    transfer = relationship("OwnershipTransfer")


class OwnershipActivity(Base):
    """Immutable log of governance changes and owner assignments."""

    __tablename__ = "ownership_activity"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    event_type: str = Column(String(100), nullable=False)  # Owner Added | Owner Removed | Team Joined | Repository Changed | Workspace Changed | Organization Changed
    actor_id: str = Column(String(36), ForeignKey("users.uuid"), nullable=False)
    details: Optional[str] = Column(Text, nullable=True)
    timestamp: datetime = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")
    actor = relationship("User")


class FeatureFlag(Base):
    """Stores global, organizational, or workspace feature toggles."""

    __tablename__ = "feature_flags"

    id: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key: str = Column(String(100), unique=True, nullable=False, index=True)
    enabled: bool = Column(Boolean, default=False)
    description: Optional[str] = Column(String(512), nullable=True)
    scope: str = Column(String(50), default="GLOBAL")  # GLOBAL | WORKSPACE | ORGANIZATION
    workspace_id: Optional[str] = Column(String(36), nullable=True)
    organization_id: Optional[str] = Column(String(36), nullable=True)


class Notification(Base):
    """System-wide user notification logs."""

    __tablename__ = "notifications"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: str = Column(String(36), ForeignKey("users.uuid"), nullable=False, index=True)
    project_id: Optional[str] = Column(String(36), ForeignKey("projects.id"), nullable=True, index=True)
    workspace_id: Optional[str] = Column(String(36), ForeignKey("workspaces.workspace_id"), nullable=True, index=True)
    title: str = Column(String(255), nullable=False)
    message: str = Column(Text, nullable=False)
    category: str = Column(String(50), default="SYSTEM")  # REPOSITORY | EVALUATION | OWNERSHIP | WORKSPACE | SECURITY | VERSION | DISCUSSION | INVITATION | SYSTEM
    priority: str = Column(String(50), default="NORMAL")  # LOW | NORMAL | HIGH | CRITICAL
    severity: str = Column(String(50), default="INFO")  # INFO | WARNING | ERROR
    is_read: bool = Column(Boolean, default=False)
    action_url: Optional[str] = Column(String(512), nullable=True)
    timestamp: datetime = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    project = relationship("Project")
    workspace = relationship("Workspace")


class BackgroundJob(Base):
    """Abstract background tasks/jobs ledger."""

    __tablename__ = "background_jobs"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    job_type: str = Column(String(100), nullable=False)  # REPO_SYNC | METADATA_EXTRACT | FILE_INDEX | NOTIF_DISPATCH | DNA_GEN | INTEL_REFRESH
    status: str = Column(String(50), default="QUEUED")  # QUEUED | RUNNING | COMPLETED | FAILED | CANCELLED
    priority: str = Column(String(50), default="NORMAL")  # LOW | NORMAL | HIGH
    progress: float = Column(Float, default=0.0)
    result: Optional[str] = Column(Text, nullable=True)
    error_log: Optional[str] = Column(Text, nullable=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    started_at: Optional[datetime] = Column(DateTime, nullable=True)
    completed_at: Optional[datetime] = Column(DateTime, nullable=True)

    project = relationship("Project")


class SimilarityPolicy(Base):
    """Defines configurable weights, thresholds, and ignore rules for DNA similarity comparisons."""

    __tablename__ = "similarity_policies"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Optional[str] = Column(String(36), ForeignKey("workspaces.workspace_id"), nullable=True, index=True)
    name: str = Column(String(100), nullable=False)
    weight_architecture: float = Column(Float, default=0.30)
    weight_technology: float = Column(Float, default=0.15)
    weight_workflow: float = Column(Float, default=0.20)
    weight_api: float = Column(Float, default=0.10)
    weight_security: float = Column(Float, default=0.10)
    weight_repository: float = Column(Float, default=0.05)
    weight_deployment: float = Column(Float, default=0.05)
    weight_documentation: float = Column(Float, default=0.05)
    threshold_high_similarity: float = Column(Float, default=0.85)
    ignored_paths: Optional[str] = Column(Text, nullable=True)  # JSON-serialized list
    ignored_extensions: Optional[str] = Column(Text, nullable=True)  # JSON-serialized list
    version: int = Column(Integer, default=1, nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    workspace = relationship("Workspace")


class ProjectDNASnapshot(Base):
    """Immutable version snapshot of a project's DNA genome."""

    __tablename__ = "project_dna_snapshots"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    repository_snapshot_id: Optional[str] = Column(String(36), ForeignKey("repository_snapshots.snapshot_id"), nullable=True)
    version: str = Column(String(50), default="v1")
    status: str = Column(String(50), default="QUEUED")  # QUEUED | PARSING | EXTRACTING | GENERATING | COMPLETED | FAILED | STALE
    health: str = Column(String(50), default="Healthy")  # Healthy | Partial | Outdated | Needs Regeneration | Corrupted
    extraction_report: Optional[str] = Column(Text, nullable=True)  # JSON checklist of extractor success
    dna_manifest: Optional[str] = Column(Text, nullable=True)  # JSON details of engine, algorithms, and options used
    
    overall_confidence: float = Column(Float, default=1.0)
    repository_confidence: float = Column(Float, default=1.0)
    architecture_confidence: float = Column(Float, default=1.0)
    technology_confidence: float = Column(Float, default=1.0)
    dependency_confidence: float = Column(Float, default=1.0)
    api_confidence: float = Column(Float, default=1.0)
    ai_confidence: float = Column(Float, default=1.0)
    security_confidence: float = Column(Float, default=1.0)
    workflow_confidence: float = Column(Float, default=1.0)
    deployment_confidence: float = Column(Float, default=1.0)
    documentation_confidence: float = Column(Float, default=1.0)
    metrics_confidence: float = Column(Float, default=1.0)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")
    repository_snapshot = relationship("RepositorySnapshot")


class ProjectDNAFeature(Base):
    """A normalized representation of key extracted genome features for fast search index lookup."""

    __tablename__ = "project_dna_features"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dna_snapshot_id: str = Column(String(36), ForeignKey("project_dna_snapshots.uuid"), nullable=False, index=True)
    dimension: str = Column(String(50), index=True, nullable=False)  # Technology | Architecture | API | AI | etc.
    feature_type: str = Column(String(100), index=True, nullable=False)  # Library | Framework | Layer | DB
    feature_name: str = Column(String(255), nullable=False)
    value: Optional[str] = Column(Text, nullable=True)  # Optional metadata details
    confidence: float = Column(Float, default=1.0)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    dna_snapshot = relationship("ProjectDNASnapshot")


class ProjectDNAFingerprint(Base):
    """Stores independent canonical fingerprints for each dimension to enable fast similarity query lookup."""

    __tablename__ = "project_dna_fingerprints"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dna_snapshot_id: str = Column(String(36), ForeignKey("project_dna_snapshots.uuid"), nullable=False, index=True)
    fingerprint_algorithm_version: str = Column(String(20), default="v1")
    architecture_hash: Optional[str] = Column(String(64), nullable=True)
    technology_hash: Optional[str] = Column(String(64), nullable=True)
    dependency_hash: Optional[str] = Column(String(64), nullable=True)
    workflow_hash: Optional[str] = Column(String(64), nullable=True)
    repository_hash: Optional[str] = Column(String(64), nullable=True)
    api_hash: Optional[str] = Column(String(64), nullable=True)
    deployment_hash: Optional[str] = Column(String(64), nullable=True)
    documentation_hash: Optional[str] = Column(String(64), nullable=True)
    security_hash: Optional[str] = Column(String(64), nullable=True)
    ai_hash: Optional[str] = Column(String(64), nullable=True)

    dna_snapshot = relationship("ProjectDNASnapshot")


class ComparisonSession(Base):
    """Tracks reviewer comparison sessions. Enforces workspace isolation."""

    __tablename__ = "comparison_sessions"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: str = Column(String(36), ForeignKey("workspaces.workspace_id"), nullable=False, index=True)
    user_id: str = Column(String(36), ForeignKey("users.uuid"), nullable=False)
    source_project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False)
    target_project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False)
    source_dna_snapshot_id: str = Column(String(36), ForeignKey("project_dna_snapshots.uuid"), nullable=False)
    target_dna_snapshot_id: str = Column(String(36), ForeignKey("project_dna_snapshots.uuid"), nullable=False)
    
    overall_similarity: Optional[float] = Column(Float, nullable=True)
    confidence: Optional[float] = Column(Float, nullable=True)
    risk_level: Optional[str] = Column(String(50), nullable=True)  # LOW | MEDIUM | HIGH | CRITICAL
    recommendation: Optional[str] = Column(String(255), nullable=True)
    ai_summary: Optional[str] = Column(Text, nullable=True)
    
    reviewer_decision: str = Column(String(50), default="PENDING")  # PENDING | DISMISS | REVIEW_REQUIRED | ACCEPT
    reviewer_comment: Optional[str] = Column(Text, nullable=True)
    assigned_reviewer_id: Optional[str] = Column(String(36), ForeignKey("users.uuid"), nullable=True)
    status: str = Column(String(50), default="QUEUED")  # QUEUED | RUNNING | COMPLETED | FAILED
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    workspace = relationship("Workspace")
    user = relationship("User", foreign_keys=[user_id])
    source_project = relationship("Project", foreign_keys=[source_project_id])
    target_project = relationship("Project", foreign_keys=[target_project_id])
    source_dna = relationship("ProjectDNASnapshot", foreign_keys=[source_dna_snapshot_id])
    target_dna = relationship("ProjectDNASnapshot", foreign_keys=[target_dna_snapshot_id])


class ComparisonEvidence(Base):
    """Normalized evidence list for explaining matches in comparison sessions."""

    __tablename__ = "comparison_evidence"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: str = Column(String(36), ForeignKey("comparison_sessions.uuid"), nullable=False, index=True)
    dimension: str = Column(String(50), nullable=False)  # Architecture | Technology | etc.
    evidence_type: str = Column(String(100), nullable=False)  # Matching Layer | Matching API | etc.
    description: str = Column(Text, nullable=False)
    confidence: float = Column(Float, default=1.0)
    reference_uri: Optional[str] = Column(String(512), nullable=True)
    severity: str = Column(String(50), default="INFO")  # INFO | WARNING | ERROR

    session = relationship("ComparisonSession", backref="evidences")


# ── Phase 7 Decision Intelligence & Governance Models ─────────────────────────

class DecisionPolicy(Base):
    """Enforceable decision boundaries, thresholds and compliance configurations."""
    __tablename__ = "decision_policies"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: Optional[str] = Column(String(36), ForeignKey("workspaces.workspace_id"), nullable=True, index=True)
    name: str = Column(String(100), nullable=False)
    version: int = Column(Integer, default=1, nullable=False)
    
    min_documentation_score: float = Column(Float, default=0.60)
    min_security_score: float = Column(Float, default=0.70)
    min_testing_score: float = Column(Float, default=0.50)
    min_innovation_score: float = Column(Float, default=0.30)
    max_similarity_threshold: float = Column(Float, default=0.85)
    
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    workspace = relationship("Workspace")


class DecisionRegistry(Base):
    """Pointer registry to the latest immutable DecisionSnapshot for a project."""
    __tablename__ = "decision_registry"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, unique=True, index=True)
    latest_snapshot_id: Optional[str] = Column(String(36), nullable=True)  # References DecisionSnapshot.uuid
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project")


class DecisionSnapshot(Base):
    """Immutable snapshot of a project's unified decision and scores context."""
    __tablename__ = "decision_snapshots"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    version: int = Column(Integer, default=1, nullable=False)
    
    overall_score: float = Column(Float, default=0.0)
    engineering_score: float = Column(Float, default=0.0)
    security_score: float = Column(Float, default=0.0)
    architecture_score: float = Column(Float, default=0.0)
    innovation_score: float = Column(Float, default=0.0)
    business_score: float = Column(Float, default=0.0)
    deployment_score: float = Column(Float, default=0.0)
    maintainability_score: float = Column(Float, default=0.0)
    
    overall_confidence: float = Column(Float, default=1.0)
    agent_confidence: float = Column(Float, default=1.0)
    dna_confidence: float = Column(Float, default=1.0)
    evidence_confidence: float = Column(Float, default=1.0)
    policy_confidence: float = Column(Float, default=1.0)
    
    lifecycle_status: str = Column(String(50), default="GENERATED")  # GENERATED | UNDER_REVIEW | ACCEPTED | REJECTED | IMPLEMENTED | VERIFIED | ARCHIVED
    verdict: str = Column(String(50), default="PENDING")  # APPROVED | REVIEW_REQUIRED | REJECTED | PENDING

    # Context versions for reproducibility
    repository_snapshot_id: Optional[str] = Column(String(36), nullable=True)
    dna_snapshot_id: Optional[str] = Column(String(36), nullable=True)
    similarity_policy_version: Optional[int] = Column(Integer, nullable=True)
    decision_policy_version: Optional[int] = Column(Integer, nullable=True)
    agent_versions_json: Optional[str] = Column(Text, nullable=True)  # JSON-serialized map of agent versions
    llm_model_version: Optional[str] = Column(String(100), nullable=True)
    evaluation_version: Optional[str] = Column(String(50), nullable=True)
    workspace_id: Optional[str] = Column(String(36), nullable=True)
    
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")


class DecisionEvidenceStore(Base):
    """Implements centralized repository for decision and risk explanation traces."""
    __tablename__ = "decision_evidence_store"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    dimension: str = Column(String(50), nullable=False)
    evidence_type: str = Column(String(100), nullable=False)
    description: str = Column(Text, nullable=False)
    confidence: float = Column(Float, default=1.0)
    reference_uri: Optional[str] = Column(String(512), nullable=True)
    severity: str = Column(String(50), default="INFO")
    created_at: datetime = Column(DateTime, default=datetime.utcnow)


class ExecutiveRecommendation(Base):
    """Actionable improvement roadmap generated for developers and CTOs."""
    __tablename__ = "executive_recommendations"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    version: int = Column(Integer, default=1, nullable=False)
    
    category: str = Column(String(100), nullable=False)  # Security | Engineering | etc.
    title: str = Column(String(200), nullable=False)
    description: str = Column(Text, nullable=False)
    priority: str = Column(String(50), default="MEDIUM")  # HIGH | MEDIUM | LOW
    impact: str = Column(String(50), default="MEDIUM")  # HIGH | MEDIUM | LOW
    estimated_effort: str = Column(String(100), nullable=True)
    business_value: str = Column(String(100), nullable=True)
    technical_value: str = Column(String(100), nullable=True)
    suggested_owner: Optional[str] = Column(String(100), nullable=True)
    status: str = Column(String(50), default="Generated")  # Generated | Assigned | Accepted | In Progress | Blocked | Completed | Verified | Closed
    
    # Provenance fields linking back to source models
    source_ids_json: Optional[str] = Column(Text, nullable=True)  # JSON-serialized list of agent/evidence IDs
    dependencies_json: Optional[str] = Column(Text, nullable=True)  # JSON-serialized list of recommendation UUIDs
    
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project")


class ProjectRisk(Base):
    """Detailed risk assessment mapping likelihood, severity, and mitigation guidelines."""
    __tablename__ = "project_risks"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    risk_type: str = Column(String(100), nullable=False)  # Technical | Security | Compliance | etc.
    severity: str = Column(String(50), default="MEDIUM")  # CRITICAL | HIGH | MEDIUM | LOW
    likelihood: str = Column(String(50), default="MEDIUM")  # HIGH | MEDIUM | LOW
    impact_description: str = Column(Text, nullable=False)
    mitigation_strategy: str = Column(Text, nullable=False)
    evidence_reference: Optional[str] = Column(Text, nullable=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")


class GovernanceWorkflow(Base):
    """Checkpoints and review status for project stage approvals."""
    __tablename__ = "governance_workflows"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    step_name: str = Column(String(100), nullable=False)  # e.g., Code Review, Security Audit, CTO Approval
    status: str = Column(String(50), default="PENDING")  # PENDING | APPROVED | REJECTED | EXCEPTION
    assigned_to: Optional[str] = Column(String(36), ForeignKey("users.uuid"), nullable=True)
    reviewed_by: Optional[str] = Column(String(36), ForeignKey("users.uuid"), nullable=True)
    reviewer_comments: Optional[str] = Column(Text, nullable=True)
    compliance_status: str = Column(String(50), default="COMPLIANT")  # COMPLIANT | NON_COMPLIANT
    
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")


class GovernanceAuditTrail(Base):
    """Immutable audit records of all approval changes, overrides, or policy exceptions."""
    __tablename__ = "governance_audit_trails"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    action: str = Column(String(100), nullable=False)  # APPROVE | REJECT | GRANT_EXCEPTION | ASSIGN
    actor_id: str = Column(String(36), ForeignKey("users.uuid"), nullable=False)
    details: str = Column(Text, nullable=False)
    timestamp: datetime = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")
    actor = relationship("User")


class ProjectSimulation(Base):
    """Saves historical simulation runs of weight/vulnerability modifications."""
    __tablename__ = "project_simulations"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: str = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    inputs_json: str = Column(Text, nullable=False)  # JSON-serialized weight adjustments
    predicted_score: float = Column(Float, nullable=False)
    actual_outcome_score: Optional[float] = Column(Float, nullable=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")


class ExecutiveKPIRegistry(Base):
    """Persists aggregated historical KPI trends to avoid expensive runs."""
    __tablename__ = "executive_kpi_registry"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: str = Column(String(36), ForeignKey("workspaces.workspace_id"), nullable=False, index=True)
    metric_date: datetime = Column(DateTime, default=datetime.utcnow, index=True)
    metric_name: str = Column(String(100), nullable=False)
    value: float = Column(Float, nullable=False)
    
    created_at: datetime = Column(DateTime, default=datetime.utcnow)


# ── Phase 8A Enterprise Platform Foundation Models ───────────────────────────

class EnterpriseConnector(Base):
    """Stores metadata and capabilities registry for integrated third-party systems."""
    __tablename__ = "enterprise_connectors"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: str = Column(String(36), ForeignKey("workspaces.workspace_id"), nullable=False, index=True)
    name: str = Column(String(100), nullable=False)
    connector_type: str = Column(String(50), nullable=False)  # github | gitlab | jira | slack | etc.
    status: str = Column(String(50), default="CREATED")  # CREATED | ACTIVE | SYNCING | FAILED | REVOKED
    capabilities_json: Optional[str] = Column(Text, nullable=True)  # JSON-serialized manifest capabilities
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    workspace = relationship("Workspace")


class ConnectorSync(Base):
    """Log history of background connector sync schedules."""
    __tablename__ = "connector_syncs"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    connector_id: str = Column(String(36), ForeignKey("enterprise_connectors.uuid"), nullable=False, index=True)
    sync_status: str = Column(String(50), default="SUCCESS")  # SUCCESS | FAILED
    records_synced: int = Column(Integer, default=0)
    error_message: Optional[str] = Column(Text, nullable=True)
    started_at: datetime = Column(DateTime, default=datetime.utcnow)
    finished_at: datetime = Column(DateTime, default=datetime.utcnow)

    connector = relationship("EnterpriseConnector")


class ConnectorJob(Base):
    """Executions tracker of integration sync jobs."""
    __tablename__ = "connector_jobs"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    connector_id: str = Column(String(36), ForeignKey("enterprise_connectors.uuid"), nullable=False, index=True)
    job_status: str = Column(String(50), default="RUNNING")  # RUNNING | COMPLETED | FAILED
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    finished_at: Optional[datetime] = Column(DateTime, nullable=True)

    connector = relationship("EnterpriseConnector")


class ConnectorJobStep(Base):
    """Individual checkpoint steps for connector job resiliency."""
    __tablename__ = "connector_job_steps"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id: str = Column(String(36), ForeignKey("connector_jobs.uuid"), nullable=False, index=True)
    step_name: str = Column(String(100), nullable=False)
    status: str = Column(String(50), default="COMPLETED")  # COMPLETED | FAILED
    completed_at: datetime = Column(DateTime, default=datetime.utcnow)


class ConnectorCheckpoint(Base):
    """Delta markers and pagination state tokens for sync tracking."""
    __tablename__ = "connector_checkpoints"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    connector_id: str = Column(String(36), ForeignKey("enterprise_connectors.uuid"), nullable=False, unique=True, index=True)
    checkpoint_token: Optional[str] = Column(String(512), nullable=True)
    last_sync_timestamp: datetime = Column(DateTime, default=datetime.utcnow)


class SecretsVault(Base):
    """Encrypted storage references for OAuth, PAT, and credential keys."""
    __tablename__ = "secrets_vault"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    connector_id: str = Column(String(36), ForeignKey("enterprise_connectors.uuid"), nullable=False, index=True)
    encrypted_secret: str = Column(Text, nullable=False)
    secret_key_name: str = Column(String(100), nullable=False)  # oauth_token | pat | refresh_token
    current_version: int = Column(Integer, default=1)
    expires_at: Optional[datetime] = Column(DateTime, nullable=True)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SecretVersion(Base):
    """Historical secret values record for audit trail trace."""
    __tablename__ = "secret_versions"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    secret_id: str = Column(String(36), ForeignKey("secrets_vault.uuid"), nullable=False, index=True)
    encrypted_secret: str = Column(Text, nullable=False)
    version: int = Column(Integer, nullable=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)


class SecretAccessLog(Base):
    """Audit logs tracking when credentials keys get read by adapters."""
    __tablename__ = "secret_access_logs"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    secret_id: str = Column(String(36), ForeignKey("secrets_vault.uuid"), nullable=False, index=True)
    actor_id: str = Column(String(36), ForeignKey("users.uuid"), nullable=False)
    accessed_at: datetime = Column(DateTime, default=datetime.utcnow)


class SecretRotationPolicy(Base):
    """Enforces rotation schedule rules on active secret tokens."""
    __tablename__ = "secret_rotation_policies"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    secret_id: str = Column(String(36), ForeignKey("secrets_vault.uuid"), nullable=False, index=True)
    rotation_days: int = Column(Integer, default=90)
    last_rotated: datetime = Column(DateTime, default=datetime.utcnow)
    next_rotation: datetime = Column(DateTime, default=datetime.utcnow)
    status: str = Column(String(50), default="ACTIVE")  # ACTIVE | PAUSED


class PlatformPlugin(Base):
    """Manifest settings and permissions configuration for installed extensions."""
    __tablename__ = "platform_plugins"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: str = Column(String(100), nullable=False)
    version: str = Column(String(50), nullable=False)
    description: Optional[str] = Column(Text, nullable=True)
    publisher: str = Column(String(100), nullable=False)
    is_verified: bool = Column(Boolean, default=False)
    permissions_json: str = Column(Text, default="[]")  # JSON-serialized list of scopes
    sandboxed: bool = Column(Boolean, default=True)
    status: str = Column(String(50), default="ACTIVE")  # ACTIVE | DISABLED
    created_at: datetime = Column(DateTime, default=datetime.utcnow)


class PluginVersion(Base):
    """Compatible targets tracking for system extensions version matrices."""
    __tablename__ = "plugin_versions"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plugin_id: str = Column(String(36), ForeignKey("platform_plugins.uuid"), nullable=False, index=True)
    version: str = Column(String(50), nullable=False)
    min_backend_version: str = Column(String(50), default="1.0.0")
    created_at: datetime = Column(DateTime, default=datetime.utcnow)


class PluginPermission(Base):
    """Granular permissions scopes requested by extensions."""
    __tablename__ = "plugin_permissions"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plugin_id: str = Column(String(36), ForeignKey("platform_plugins.uuid"), nullable=False, index=True)
    permission_name: str = Column(String(100), nullable=False)  # e.g., PROJECT_READ, WORKSPACE_READ
    granted: bool = Column(Boolean, default=True)


class PluginExecution(Base):
    """Sandboxed execution resource logs tracking exit outcomes."""
    __tablename__ = "plugin_executions"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    plugin_id: str = Column(String(36), ForeignKey("platform_plugins.uuid"), nullable=False, index=True)
    workspace_id: str = Column(String(36), ForeignKey("workspaces.workspace_id"), nullable=False, index=True)
    memory_usage_mb: float = Column(Float, default=0.0)
    cpu_usage_percent: float = Column(Float, default=0.0)
    exit_code: int = Column(Integer, default=0)
    started_at: datetime = Column(DateTime, default=datetime.utcnow)
    ended_at: datetime = Column(DateTime, default=datetime.utcnow)


class MarketplaceItem(Base):
    """Publisher verification packages catalogued in marketplace indexes."""
    __tablename__ = "marketplace_items"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: str = Column(String(100), nullable=False)
    item_type: str = Column(String(50), nullable=False)  # plugin | policy | template | report
    publisher: str = Column(String(100), nullable=False)
    trust_score: float = Column(Float, default=5.0)
    downloads: int = Column(Integer, default=0)
    is_verified: bool = Column(Boolean, default=False)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)


class MarketplaceInstall(Base):
    """Installation registry mapping local workspace extensions downloads."""
    __tablename__ = "marketplace_installs"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    marketplace_item_id: str = Column(String(36), ForeignKey("marketplace_items.uuid"), nullable=False, index=True)
    workspace_id: str = Column(String(36), ForeignKey("workspaces.workspace_id"), nullable=False, index=True)
    status: str = Column(String(50), default="INSTALLED")  # INSTALLED | FAILED
    installed_at: datetime = Column(DateTime, default=datetime.utcnow)


class EnterpriseWebhook(Base):
    """Outbound endpoints registered by workspaces for Event Bus messages."""
    __tablename__ = "enterprise_webhooks"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workspace_id: str = Column(String(36), ForeignKey("workspaces.workspace_id"), nullable=False, index=True)
    target_url: str = Column(String(512), nullable=False)
    events_json: str = Column(Text, default="[]")  # JSON-serialized list of event names
    hmac_key: str = Column(String(100), nullable=False)
    status: str = Column(String(50), default="ACTIVE")  # ACTIVE | INACTIVE
    created_at: datetime = Column(DateTime, default=datetime.utcnow)


class WebhookDelivery(Base):
    """Logs detailing delivery status retries, response codes, and DLQ flags."""
    __tablename__ = "webhook_deliveries"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    webhook_id: str = Column(String(36), ForeignKey("enterprise_webhooks.uuid"), nullable=False, index=True)
    event_name: str = Column(String(100), nullable=False)
    response_code: Optional[int] = Column(Integer, nullable=True)
    status: str = Column(String(50), default="SUCCESS")  # SUCCESS | FAILED | DLQ
    payload_json: str = Column(Text, nullable=False)
    retry_count: int = Column(Integer, default=0)
    attempted_at: datetime = Column(DateTime, default=datetime.utcnow)

    webhook = relationship("EnterpriseWebhook")


class WebhookReplay(Base):
    """Replay executions logs tracking verified retry attempts."""
    __tablename__ = "webhook_replays"

    uuid: str = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    delivery_id: str = Column(String(36), ForeignKey("webhook_deliveries.uuid"), nullable=False, index=True)
    requested_by: str = Column(String(36), ForeignKey("users.uuid"), nullable=False)
    replayed_at: datetime = Column(DateTime, default=datetime.utcnow)


# ── Dependency helper ──────────────────────────────────────────────────────────

def get_db():
    """FastAPI dependency that yields a database session."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables and perform automatic schema migrations for missing columns/indexes."""
    # 1. Create tables if they do not exist
    Base.metadata.create_all(bind=engine)

    # 2. Inspect database for missing columns and run migrations dynamically
    from sqlalchemy import inspect, text
    insp = inspect(engine)

    with engine.begin() as conn:
        for table_name, table_obj in Base.metadata.tables.items():
            try:
                db_cols = {c["name"] for c in insp.get_columns(table_name)}
            except Exception:
                continue

            # A. Remove obsolete columns (e.g. project_id in tables where it's not defined in ORM)
            if "project_id" in db_cols and "project_id" not in table_obj.columns:
                print(f"[MIGRATION] Recreating table '{table_name}' to remove obsolete column 'project_id'.")
                old_table_name = f"{table_name}_old"
                try:
                    # Rename old table
                    conn.execute(text(f"ALTER TABLE {table_name} RENAME TO {old_table_name}"))
                    
                    # Create new table using ORM metadata
                    table_obj.create(bind=conn)
                    
                    # Retrieve columns of the new table
                    new_cols = {c.name for c in table_obj.columns}
                    
                    # Intersection of columns
                    common_cols = list(new_cols.intersection(db_cols))
                    cols_str = ", ".join(f'"{c}"' for c in common_cols)
                    
                    # Copy data
                    conn.execute(text(f"INSERT INTO {table_name} ({cols_str}) SELECT {cols_str} FROM {old_table_name}"))
                    
                    # Drop old table
                    conn.execute(text(f"DROP TABLE {old_table_name}"))
                    print(f"[MIGRATION] Successfully recreated table '{table_name}' to drop column 'project_id'.")
                except Exception as e:
                    print(f"[MIGRATION] Re-creating table '{table_name}' failed: {e}")
                    try:
                        conn.execute(text(f"DROP TABLE {old_table_name}"))
                    except Exception:
                        pass
                
                # Re-fetch database columns after potentially modifying the table
                try:
                    db_cols = {c["name"] for c in insp.get_columns(table_name)}
                except Exception:
                    continue

            # B. Add missing columns
            for col in table_obj.columns:
                if col.name not in db_cols:
                    col_name = col.name
                    # Simplify column type string representation for SQLite ALTER TABLE
                    col_type_str = str(col.type)
                    if "VARCHAR" in col_type_str:
                        col_type_str = "VARCHAR(255)"
                    elif "DATETIME" in col_type_str:
                        col_type_str = "DATETIME"
                    elif "FLOAT" in col_type_str:
                        col_type_str = "FLOAT"
                    elif "INTEGER" in col_type_str:
                        col_type_str = "INTEGER"
                    elif "TEXT" in col_type_str:
                        col_type_str = "TEXT"
                        
                    alter_query = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type_str}"
                    try:
                        conn.execute(text(alter_query))
                        print(f"[MIGRATION] Added column '{col_name}' to table '{table_name}'.")
                    except Exception as e:
                        print(f"[MIGRATION] Failed to add column '{col_name}' to '{table_name}': {e}")
