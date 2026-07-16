from modules.project_dna.extractors.base import BaseExtractor
from modules.project_dna.extractors.repository import RepositoryExtractor
from modules.project_dna.extractors.architecture import ArchitectureExtractor
from modules.project_dna.extractors.technology import TechnologyExtractor
from modules.project_dna.extractors.dependency import DependencyExtractor
from modules.project_dna.extractors.api import APIExtractor
from modules.project_dna.extractors.ai import AIExtractor
from modules.project_dna.extractors.security import SecurityExtractor
from modules.project_dna.extractors.workflow import WorkflowExtractor
from modules.project_dna.extractors.documentation import DocumentationExtractor
from modules.project_dna.extractors.deployment import DeploymentExtractor
from modules.project_dna.extractors.metrics import MetricsExtractor

# Registry lists ordered by extractor priority to manage pipeline execution dependencies
EXTRACTOR_PIPELINE = [
    RepositoryExtractor,
    TechnologyExtractor,
    DependencyExtractor,
    DocumentationExtractor,
    MetricsExtractor,
    ArchitectureExtractor,
    APIExtractor,
    AIExtractor,
    SecurityExtractor,
    WorkflowExtractor,
    DeploymentExtractor,
]
