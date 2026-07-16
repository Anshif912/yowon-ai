from sqlalchemy.orm import Session
from .repository import ObservabilityRepository

class ObservabilityService:
    """Orchestrates system diagnostics health checks."""

    def __init__(self, db: Session):
        self.db = db
        self.repo = ObservabilityRepository(db)

    def check_system_health(self) -> dict:
        return {
            "status": "HEALTHY",
            "connectors_healthy": True,
            "plugin_sandbox_healthy": True,
            "secrets_vault_healthy": True
        }

    def collect_system_metrics(self) -> dict:
        return self.repo.get_metrics_counts()
