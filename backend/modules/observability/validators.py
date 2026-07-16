# Validators for Observability
def validate_metric_name(name: str) -> bool:
    return name.lower() in ["connector_syncs_total", "plugins_installed", "webhooks_dispatched", "secrets_accessed_total"]
