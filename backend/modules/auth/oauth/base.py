from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseOAuthProvider(ABC):
    @abstractmethod
    def get_auth_url(self, redirect_uri: str, state: str) -> str:
        """Returns the authorization URL to redirect the user to."""
        pass

    @abstractmethod
    async def get_user_info(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        """Exchanges authorization code for access token and fetches user info."""
        pass
