from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseGitProvider(ABC):
    @abstractmethod
    async def fetch_user_orgs(self, token: str) -> List[Dict[str, Any]]:
        """Fetches the user's organizations/profiles."""
        pass

    @abstractmethod
    async def fetch_repositories(self, token: str, org_login: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetches the repositories for the user or organization."""
        pass

    @abstractmethod
    async def fetch_branches(self, token: str, repo_full_name: str) -> List[Dict[str, Any]]:
        """Fetches the branches of the specified repository."""
        pass

    @abstractmethod
    async def fetch_commits(self, token: str, repo_full_name: str, branch: str, since_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetches the commits of the specified repository branch."""
        pass

    @abstractmethod
    async def fetch_pull_requests(self, token: str, repo_full_name: str) -> List[Dict[str, Any]]:
        """Fetches the pull requests of the specified repository."""
        pass

    @abstractmethod
    async def fetch_issues(self, token: str, repo_full_name: str) -> List[Dict[str, Any]]:
        """Fetches the issues of the specified repository."""
        pass

    @abstractmethod
    async def fetch_contributors(self, token: str, repo_full_name: str) -> List[Dict[str, Any]]:
        """Fetches the contributors of the specified repository."""
        pass

    @abstractmethod
    async def register_webhook(self, token: str, repo_full_name: str, callback_url: str, secret: str) -> Optional[int]:
        """Registers a webhook on the repository, returning the webhook ID."""
        pass
