import os
import logging
from typing import Dict, Any
from modules.auth.oauth.base import BaseOAuthProvider

logger = logging.getLogger("yowon.auth.oauth.github")

class GitHubOAuthProvider(BaseOAuthProvider):
    def __init__(self):
        self.client_id = os.getenv("GITHUB_CLIENT_ID", "")
        self.client_secret = os.getenv("GITHUB_CLIENT_SECRET", "")
        self.is_configured = bool(self.client_id and self.client_secret)
        logger.info(
            f"[GitHubOAuthProvider] Initialization - "
            f"configured={self.is_configured}, "
            f"client_id_len={len(self.client_id)}"
        )

    def get_auth_url(self, redirect_uri: str, state: str) -> str:
        if not self.is_configured:
            logger.error("[GitHubOAuthProvider] Attempted to get Auth URL but provider is not configured.")
            raise ValueError("GitHub OAuth provider is not configured.")
        
        auth_url = (
            f"https://github.com/login/oauth/authorize?"
            f"client_id={self.client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"scope=user:email&"
            f"state={state}"
        )
        logger.info(
            f"[GitHubOAuthProvider] Auth URL Generated - "
            f"redirect_uri={redirect_uri}, state={state}"
        )
        return auth_url

    async def get_user_info(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        if not self.is_configured:
            logger.error("[GitHubOAuthProvider] Attempted to exchange code but provider is not configured.")
            raise ValueError("GitHub OAuth provider is not configured.")
        
        logger.info(
            f"[GitHubOAuthProvider] Token Exchange Initiated - "
            f"code_len={len(code)}, redirect_uri={redirect_uri}"
        )
        
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
            
            try:
                token_resp = await client.post(token_url, data=data, headers=headers)
            except Exception as e:
                logger.error(f"[GitHubOAuthProvider] HTTP error during token exchange: {e}")
                raise
                
            if token_resp.status_code != 200:
                logger.error(f"[GitHubOAuthProvider] Token exchange failed with status {token_resp.status_code}: {token_resp.text}")
                raise ValueError(f"Failed to retrieve GitHub token: {token_resp.text}")
            
            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            if not access_token:
                logger.error(f"[GitHubOAuthProvider] Access token missing from GitHub response: {token_data}")
                raise ValueError(f"Access token missing from GitHub response: {token_data}")
            
            logger.info("[GitHubOAuthProvider] Token Exchange Success - Access token received.")
            
            # 2. Fetch user profile
            user_url = "https://api.github.com/user"
            headers = {
                "Authorization": f"token {access_token}",
                "User-Agent": "YOWON-AI-Enterprise"
            }
            
            try:
                user_resp = await client.get(user_url, headers=headers)
            except Exception as e:
                logger.error(f"[GitHubOAuthProvider] HTTP error during user profile fetch: {e}")
                raise
                
            if user_resp.status_code != 200:
                logger.error(f"[GitHubOAuthProvider] User profile fetch failed with status {user_resp.status_code}: {user_resp.text}")
                raise ValueError(f"Failed to retrieve GitHub user: {user_resp.text}")
            
            user_data = user_resp.json()
            
            # 3. Fetch primary email if not public in profile
            email = user_data.get("email")
            if not email:
                logger.info("[GitHubOAuthProvider] Email is not public in profile. Fetching primary email from api.github.com/user/emails...")
                email_url = "https://api.github.com/user/emails"
                
                try:
                    email_resp = await client.get(email_url, headers=headers)
                except Exception as e:
                    logger.error(f"[GitHubOAuthProvider] HTTP error during email fetch: {e}")
                    raise
                    
                if email_resp.status_code == 200:
                    emails = email_resp.json()
                    primary_email = next((e.get("email") for e in emails if e.get("primary")), None)
                    if primary_email:
                        email = primary_email
                        logger.info(f"[GitHubOAuthProvider] Found primary email: {email}")
            
            if not email:
                email = f"{user_data.get('login')}@users.noreply.github.com"
                logger.warning(f"[GitHubOAuthProvider] No email found. Fallback to: {email}")
                
            logger.info(
                f"[GitHubOAuthProvider] User info retrieved successfully - "
                f"email={email}, login={user_data.get('login')}, id={user_data.get('id')}"
            )
            
            return {
                "email": email.lower(),
                "full_name": user_data.get("name") or user_data.get("login") or "GitHub User",
                "sso_provider": "github",
                "sso_external_id": str(user_data.get("id"))
            }

