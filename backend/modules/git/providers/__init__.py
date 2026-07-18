from modules.git.providers.base import BaseGitProvider
from modules.git.providers.github import GitHubProvider

def get_git_provider(provider_type: str = "github") -> BaseGitProvider:
    """Returns the concrete BaseGitProvider instance based on the provider type."""
    p_type = provider_type.lower()
    if p_type == "github":
        return GitHubProvider()
    else:
        raise ValueError(f"VCS Provider '{provider_type}' is not supported.")
