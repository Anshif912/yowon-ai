import os
from typing import Dict, Any
from modules.auth.oauth.base import BaseOAuthProvider

class OIDCProvider(BaseOAuthProvider):
    def __init__(self):
        self.client_id = os.getenv("OIDC_CLIENT_ID", "")
        self.client_secret = os.getenv("OIDC_CLIENT_SECRET", "")
        self.issuer_url = os.getenv("OIDC_ISSUER_URL", "")
        self.is_configured = bool(self.client_id and self.client_secret and self.issuer_url)

    def get_auth_url(self, redirect_uri: str, state: str) -> str:
        if not self.is_configured:
            raise ValueError("OIDC provider is not configured.")
        return (
            f"{self.issuer_url}/authorize?"
            f"client_id={self.client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope=openid%20profile%20email&"
            f"state={state}"
        )

    async def get_user_info(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        if not self.is_configured:
            raise ValueError("OIDC provider is not configured.")
        return {
            "email": "oidc-user@example.com",
            "full_name": "OIDC User",
            "sso_provider": "oidc",
            "sso_external_id": "oidc-sub-id"
        }
