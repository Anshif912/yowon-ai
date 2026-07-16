# Validators for Connectors package
def validate_connector_type(conn_type: str) -> bool:
    return conn_type.lower() in ["github", "gitlab", "jira", "slack", "confluence", "linear", "teams", "notion", "bitbucket", "aws_codecommit", "google_drive", "onedrive"]
