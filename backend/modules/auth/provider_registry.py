from typing import Dict, Optional, List, Any
from modules.auth.oauth.base import BaseOAuthProvider
from modules.auth.oauth.google import GoogleOAuthProvider
from modules.auth.oauth.github import GitHubOAuthProvider
from modules.auth.oauth.azure import AzureADProvider
from modules.auth.oauth.oidc import OIDCProvider

class ProviderRegistry:
    def __init__(self):
        self._providers: Dict[str, BaseOAuthProvider] = {
            "google": GoogleOAuthProvider(),
            "github": GitHubOAuthProvider(),
            "azure": AzureADProvider(),
            "oidc": OIDCProvider()
        }

    def get_provider(self, name: str) -> Optional[BaseOAuthProvider]:
        return self._providers.get(name.lower())

    def get_configured_providers(self) -> List[str]:
        return [
            name for name, provider in self._providers.items()
            if getattr(provider, "is_configured", False)
        ]

    def get_providers_metadata(self) -> Dict[str, Dict[str, Any]]:
        metadata = {}
        for name, provider in self._providers.items():
            is_configured = getattr(provider, "is_configured", False)
            if name == "google":
                metadata[name] = {
                    "name": "Google",
                    "configured": is_configured,
                    "status": "active" if is_configured else "Coming Soon",
                    "tooltip": "" if is_configured else "This authentication provider has not been configured by your administrator."
                }
            elif name == "github":
                metadata[name] = {
                    "name": "GitHub",
                    "configured": is_configured,
                    "status": "active" if is_configured else "Administrator Disabled",
                    "tooltip": "" if is_configured else "This authentication provider has not been configured by your administrator."
                }
            elif name == "azure":
                metadata[name] = {
                    "name": "Azure AD",
                    "configured": is_configured,
                    "status": "active" if is_configured else "Not Configured",
                    "tooltip": "" if is_configured else "This authentication provider has not been configured by your administrator."
                }
            elif name == "oidc":
                metadata[name] = {
                    "name": "OpenID Connect",
                    "configured": is_configured,
                    "status": "active" if is_configured else "Not Configured",
                    "tooltip": "" if is_configured else "This authentication provider has not been configured by your administrator."
                }
        return metadata

# Global registry instance
provider_registry = ProviderRegistry()
