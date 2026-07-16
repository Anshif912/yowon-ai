import os
from typing import Dict, Any
from modules.auth.oauth.base import BaseOAuthProvider

class AzureADProvider(BaseOAuthProvider):
    def __init__(self):
        self.client_id = os.getenv("AZURE_CLIENT_ID", "")
        self.client_secret = os.getenv("AZURE_CLIENT_SECRET", "")
        self.tenant_id = os.getenv("AZURE_TENANT_ID", "common")
        self.is_configured = bool(self.client_id and self.client_secret)

    def get_auth_url(self, redirect_uri: str, state: str) -> str:
        if not self.is_configured:
            raise ValueError("Azure AD provider is not configured.")
        return (
            f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/authorize?"
            f"client_id={self.client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope=openid%20profile%20email&"
            f"state={state}"
        )

    async def get_user_info(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        if not self.is_configured:
            raise ValueError("Azure AD provider is not configured.")
        return {
            "email": "azure-user@example.com",
            "full_name": "Azure User",
            "sso_provider": "azure",
            "sso_external_id": "azure-sub-id"
        }
