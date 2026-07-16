from sqlalchemy.orm import Session
from database import EnterpriseConnector, PlatformPlugin, WebhookDelivery, SecretAccessLog

class ObservabilityRepository:
    """Handles query counts for observability system metrics."""

    def __init__(self, db: Session):
        self.db = db

    def get_metrics_counts(self) -> dict:
        return {
            "connector_syncs_total": self.db.query(EnterpriseConnector).count(),
            "plugins_installed": self.db.query(PlatformPlugin).count(),
            "webhooks_dispatched": self.db.query(WebhookDelivery).count(),
            "secrets_accessed_total": self.db.query(SecretAccessLog).count()
        }
