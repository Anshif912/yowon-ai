# Validators for Webhooks
def validate_webhook_url(url: str) -> bool:
    return url.startswith("http://") or url.startswith("https://")
