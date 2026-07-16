import os
from typing import Dict, Any
from modules.auth.oauth.base import BaseOAuthProvider

class GitHubOAuthProvider(BaseOAuthProvider):
    def __init__(self):
        self.client_id = os.getenv("GITHUB_CLIENT_ID", "")
        self.client_secret = os.getenv("GITHUB_CLIENT_SECRET", "")
        self.is_configured = bool(self.client_id and self.client_secret)

    def get_auth_url(self, redirect_uri: str, state: str) -> str:
        if not self.is_configured:
            raise ValueError("GitHub OAuth provider is not configured.")
        return (
            f"https://github.com/login/oauth/authorize?"
            f"client_id={self.client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"scope=user:email&"
            f"state={state}"
        )

    async def get_user_info(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        if not self.is_configured:
            raise ValueError("GitHub OAuth provider is not configured.")
        
        import httpx
        async with httpx.AsyncClient() as client:
            # 1. Exchange code for access token
            token_url = "https://github.com/login/oauth/access_token"
            headers = {"Accept": "application/json"}
            data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code,
                "redirect_uri": redirect_uri
            }
            token_resp = await client.post(token_url, data=data, headers=headers)
            if token_resp.status_code != 200:
                raise ValueError(f"Failed to retrieve GitHub token: {token_resp.text}")
            
            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            if not access_token:
                raise ValueError(f"Access token missing from GitHub response: {token_data}")
            
            # 2. Fetch user profile
            user_url = "https://api.github.com/user"
            headers = {
                "Authorization": f"token {access_token}",
                "User-Agent": "YOWON-AI-Enterprise"
            }
            user_resp = await client.get(user_url, headers=headers)
            if user_resp.status_code != 200:
                raise ValueError(f"Failed to retrieve GitHub user: {user_resp.text}")
            
            user_data = user_resp.json()
            
            # 3. Fetch primary email if not public in profile
            email = user_data.get("email")
            if not email:
                email_url = "https://api.github.com/user/emails"
                email_resp = await client.get(email_url, headers=headers)
                if email_resp.status_code == 200:
                    emails = email_resp.json()
                    primary_email = next((e.get("email") for e in emails if e.get("primary")), None)
                    if primary_email:
                        email = primary_email
            
            if not email:
                email = f"{user_data.get('login')}@users.noreply.github.com"
                
            return {
                "email": email.lower(),
                "full_name": user_data.get("name") or user_data.get("login") or "GitHub User",
                "sso_provider": "github",
                "sso_external_id": str(user_data.get("id"))
            }
