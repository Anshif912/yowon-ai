import os
from typing import Dict, Any
from modules.auth.oauth.base import BaseOAuthProvider

class GoogleOAuthProvider(BaseOAuthProvider):
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID", "")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
        self.is_configured = bool(self.client_id and self.client_secret)

    def get_auth_url(self, redirect_uri: str, state: str) -> str:
        if not self.is_configured:
            raise ValueError("Google OAuth provider is not configured.")
        return (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={self.client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope=openid%20email%20profile&"
            f"state={state}"
        )

    async def get_user_info(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        if not self.is_configured:
            raise ValueError("Google OAuth provider is not configured.")
        
        import httpx
        async with httpx.AsyncClient() as client:
            # 1. Exchange code for access token
            token_url = "https://oauth2.googleapis.com/token"
            data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri
            }
            token_resp = await client.post(token_url, data=data)
            if token_resp.status_code != 200:
                raise ValueError(f"Failed to retrieve Google token: {token_resp.text}")
            
            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            
            # 2. Fetch user profile
            userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            headers = {"Authorization": f"Bearer {access_token}"}
            user_resp = await client.get(userinfo_url, headers=headers)
            if user_resp.status_code != 200:
                raise ValueError(f"Failed to retrieve Google userinfo: {user_resp.text}")
            
            user_data = user_resp.json()
            return {
                "email": user_data.get("email").lower(),
                "full_name": user_data.get("name", "Google User"),
                "sso_provider": "google",
                "sso_external_id": str(user_data.get("sub"))
            }
