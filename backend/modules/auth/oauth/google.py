import os
import logging
from typing import Dict, Any
from modules.auth.oauth.base import BaseOAuthProvider

logger = logging.getLogger("yowon.auth.oauth.google")

class GoogleOAuthProvider(BaseOAuthProvider):
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID", "")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
        self.is_configured = bool(self.client_id and self.client_secret)
        logger.info(
            f"[GoogleOAuthProvider] Initialization - "
            f"configured={self.is_configured}, "
            f"client_id_len={len(self.client_id)}"
        )

    def get_auth_url(self, redirect_uri: str, state: str) -> str:
        if not self.is_configured:
            logger.error("[GoogleOAuthProvider] Attempted to get Auth URL but provider is not configured.")
            raise ValueError("Google OAuth provider is not configured.")
        
        auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={self.client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope=openid%20email%20profile&"
            f"state={state}"
        )
        logger.info(
            f"[GoogleOAuthProvider] Auth URL Generated - "
            f"redirect_uri={redirect_uri}, state={state}"
        )
        return auth_url

    async def get_user_info(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        if not self.is_configured:
            logger.error("[GoogleOAuthProvider] Attempted to exchange code but provider is not configured.")
            raise ValueError("Google OAuth provider is not configured.")
        
        logger.info(
            f"[GoogleOAuthProvider] Token Exchange Initiated - "
            f"code_len={len(code)}, redirect_uri={redirect_uri}"
        )
        
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
            
            try:
                token_resp = await client.post(token_url, data=data)
            except Exception as e:
                logger.error(f"[GoogleOAuthProvider] HTTP error during token exchange: {e}")
                raise
                
            if token_resp.status_code != 200:
                logger.error(f"[GoogleOAuthProvider] Token exchange failed with status {token_resp.status_code}: {token_resp.text}")
                raise ValueError(f"Failed to retrieve Google token: {token_resp.text}")
            
            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            logger.info("[GoogleOAuthProvider] Token Exchange Success - Access token received.")
            
            # 2. Fetch user profile
            userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            headers = {"Authorization": f"Bearer {access_token}"}
            
            try:
                user_resp = await client.get(userinfo_url, headers=headers)
            except Exception as e:
                logger.error(f"[GoogleOAuthProvider] HTTP error during userinfo fetch: {e}")
                raise
                
            if user_resp.status_code != 200:
                logger.error(f"[GoogleOAuthProvider] Userinfo fetch failed with status {user_resp.status_code}: {user_resp.text}")
                raise ValueError(f"Failed to retrieve Google userinfo: {user_resp.text}")
            
            user_data = user_resp.json()
            logger.info(
                f"[GoogleOAuthProvider] Userinfo Retrieve Success - "
                f"email={user_data.get('email')}, sub={user_data.get('sub')}"
            )
            
            return {
                "email": user_data.get("email").lower(),
                "full_name": user_data.get("name", "Google User"),
                "sso_provider": "google",
                "sso_external_id": str(user_data.get("sub"))
            }

