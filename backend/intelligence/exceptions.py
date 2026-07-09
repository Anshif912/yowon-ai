"""
exceptions.py — Repository Intelligence error taxonomy.
"""

class RepositoryIntelligenceError(Exception):
    """Base exception for all Repository Intelligence failures."""
    pass

class RepositoryValidationError(RepositoryIntelligenceError):
    """Raised when pipeline input validation fails (Phase 4 quality/schema checks)."""
    pass

class RepositoryParsingError(RepositoryIntelligenceError):
    """Raised when repository parsing (AST parser / file reads) fails in a fatal way."""
    pass

class ArchitectureError(RepositoryIntelligenceError):
    """Raised when layer mapping or architecture graph generation encounters errors."""
    pass

class DependencyError(RepositoryIntelligenceError):
    """Raised when package manifest parsing or dependency mapping fails."""
    pass

class EvidenceError(RepositoryIntelligenceError):
    """Raised when evidence extraction rules encounter critical issues."""
    pass

class KnowledgeGraphError(RepositoryIntelligenceError):
    """Raised when knowledge graph construction fails."""
    pass

class TechnologyDetectionError(RepositoryIntelligenceError):
    """Raised when tech signature detection fails."""
    pass

class HealthDashboardError(RepositoryIntelligenceError):
    """Raised when health scoring calculations fail."""
    pass

class CacheSerializationError(RepositoryIntelligenceError):
    """Raised when cache loading/dumping checks fail due to incompatible schema versions."""
    pass
