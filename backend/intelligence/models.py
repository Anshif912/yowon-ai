from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class DictCompatibilityMixin:
    """
    Compatibility mixin allowing Pydantic models to mimic dictionary access,
    preventing runtime AttributeError/KeyError during architectural migration.
    """
    def get(self, key: str, default: Any = None) -> Any:
        return getattr(self, key) if hasattr(self, key) else default

    def __getitem__(self, key: str) -> Any:
        if hasattr(self, key):
            return getattr(self, key)
        raise KeyError(key)

    def __setitem__(self, key: str, value: Any) -> None:
        setattr(self, key, value)

    def __contains__(self, key: str) -> bool:
        return hasattr(self, key)

    def keys(self):
        if hasattr(self.__class__, "model_fields"):
            return self.__class__.model_fields.keys()
        return self.__dict__.keys()

    def values(self):
        return [getattr(self, k) for k in self.keys()]

    def items(self):
        return [(k, getattr(self, k)) for k in self.keys()]


class RepositoryTreeNode(DictCompatibilityMixin, BaseModel):
    name: str
    path: str
    type: str  # "file" | "dir"
    language: Optional[str] = None
    extension: Optional[str] = None
    size: int = 0
    loc: int = 0
    sha256: Optional[str] = None
    roles: Dict[str, float] = Field(default_factory=dict)  # Weighted classification: e.g. {"Entry Point": 0.98}
    generated: bool = False
    ignored: bool = False
    children: Optional[List[RepositoryTreeNode]] = None

# Support recursive type reference in Pydantic v2
RepositoryTreeNode.model_rebuild()

class SymbolRecord(DictCompatibilityMixin, BaseModel):
    name: str
    type: str  # "class" | "function" | "method" | "interface" | "route" | "decorator" | "model"
    file_path: str
    line_start: int
    line_end: int
    column_start: int
    column_end: int
    relationships: List[Dict[str, Any]] = Field(default_factory=list)

class EvidenceRecord(DictCompatibilityMixin, BaseModel):
    rule_id: str
    parser: str
    language: str
    symbol_name: Optional[str] = None
    file_path: str
    line_start: int
    line_end: int
    column_start: int
    column_end: int
    matched_code_hash: str
    confidence: float
    severity: str  # "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"

class TechnologyRecord(DictCompatibilityMixin, BaseModel):
    name: str
    version: Optional[str] = None
    confidence: float
    evidence_sources: List[str] = Field(default_factory=list)

class GraphNode(DictCompatibilityMixin, BaseModel):
    id: str
    label: str
    type: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class GraphEdge(DictCompatibilityMixin, BaseModel):
    source: str
    target: str
    label: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)

class RecommendationRecord(DictCompatibilityMixin, BaseModel):
    id: str
    evidence_ids: List[str] = Field(default_factory=list)
    triggered_rule_ids: List[str] = Field(default_factory=list)
    affected_files: List[str] = Field(default_factory=list)
    title: str
    recommendation: str
    severity: str
    expected_score_gain: float
    confidence: float
    estimated_effort: str  # "LOW" | "MEDIUM" | "HIGH"

from intelligence.canonical_models import (
    RepositoryIntelligenceSchemaException,
    CanonicalTreeDict,
    ArchitectureModel as CanonicalArchitectureDict,
    TechnologyGraphModel as CanonicalTechnologyDict,
    MetricsModel
)
