import logging
from typing import Dict, Any, List, Optional
import httpx
from modules.git.providers.base import BaseGitProvider

logger = logging.getLogger("yowon.git.providers.github")

class GitHubProvider(BaseGitProvider):
    def __init__(self, base_url: str = "https://api.github.com"):
        self.base_url = base_url

    def _get_headers(self, token: str) -> Dict[str, str]:
        return {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "YOWON-AI-Enterprise"
        }

    async def fetch_user_orgs(self, token: str) -> List[Dict[str, Any]]:
        headers = self._get_headers(token)
        async with httpx.AsyncClient() as client:
            # 1. Fetch user's own profile info as a baseline personal "organization"
            user_resp = await client.get(f"{self.base_url}/user", headers=headers)
            if user_resp.status_code != 200:
                logger.error(f"[GitHubProvider] Failed to fetch user profile: {user_resp.text}")
                return []
            
            user_data = user_resp.json()
            orgs = [{
                "github_id": user_data["id"],
                "name": user_data.get("name") or user_data["login"],
                "login": user_data["login"],
                "avatar_url": user_data.get("avatar_url"),
                "html_url": user_data.get("html_url"),
                "is_personal": True
            }]

            # 2. Fetch all real organizations
            orgs_resp = await client.get(f"{self.base_url}/user/orgs", headers=headers)
            if orgs_resp.status_code == 200:
                for org in orgs_resp.json():
                    orgs.append({
                        "github_id": org["id"],
                        "name": org.get("login"),  # Orgs don't return full name in user/orgs endpoint
                        "login": org["login"],
                        "avatar_url": org.get("avatar_url"),
                        "html_url": org.get("url"), # Orgs url
                        "is_personal": False
                    })
            return orgs

    async def fetch_repositories(self, token: str, org_login: Optional[str] = None) -> List[Dict[str, Any]]:
        headers = self._get_headers(token)
        async with httpx.AsyncClient() as client:
            # Decide URL
            if org_login:
                # Fetch repositories for organization
                url = f"{self.base_url}/orgs/{org_login}/repos?per_page=100"
            else:
                # Fetch repositories for authenticated user
                url = f"{self.base_url}/user/repos?affiliation=owner&per_page=100"

            repos = []
            while url:
                resp = await client.get(url, headers=headers)
                if resp.status_code != 200:
                    logger.error(f"[GitHubProvider] Failed to fetch repositories (org_login={org_login}): {resp.text}")
                    break
                repos.extend(resp.json())
                
                # Check pagination Link header
                link_header = resp.headers.get("Link")
                url = None
                if link_header:
                    # Link header contains e.g. <https://api.github.com/...>; rel="next"
                    for link in link_header.split(","):
                        if 'rel="next"' in link:
                            url = link.split(";")[0].strip("< >")
                            break
            
            return repos

    async def fetch_branches(self, token: str, repo_full_name: str) -> List[Dict[str, Any]]:
        headers = self._get_headers(token)
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.base_url}/repos/{repo_full_name}/branches?per_page=100", headers=headers)
            if resp.status_code != 200:
                logger.error(f"[GitHubProvider] Failed to fetch branches for {repo_full_name}: {resp.text}")
                return []
            return resp.json()

    async def fetch_commits(self, token: str, repo_full_name: str, branch: str, since_date: Optional[str] = None) -> List[Dict[str, Any]]:
        headers = self._get_headers(token)
        async with httpx.AsyncClient() as client:
            url = f"{self.base_url}/repos/{repo_full_name}/commits?sha={branch}&per_page=50"
            if since_date:
                url += f"&since={since_date}"
            resp = await client.get(url, headers=headers)
            if resp.status_code != 200:
                logger.error(f"[GitHubProvider] Failed to fetch commits for {repo_full_name} ({branch}): {resp.text}")
                return []
            return resp.json()

    async def fetch_pull_requests(self, token: str, repo_full_name: str) -> List[Dict[str, Any]]:
        headers = self._get_headers(token)
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.base_url}/repos/{repo_full_name}/pulls?state=all&per_page=50", headers=headers)
            if resp.status_code != 200:
                logger.error(f"[GitHubProvider] Failed to fetch pull requests for {repo_full_name}: {resp.text}")
                return []
            return resp.json()

    async def fetch_issues(self, token: str, repo_full_name: str) -> List[Dict[str, Any]]:
        headers = self._get_headers(token)
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.base_url}/repos/{repo_full_name}/issues?state=all&per_page=50", headers=headers)
            if resp.status_code != 200:
                logger.error(f"[GitHubProvider] Failed to fetch issues for {repo_full_name}: {resp.text}")
                return []
            # Note: GitHub issues API returns BOTH issues and pull requests (PRs have pull_request key in the object)
            # Filter out PRs so we only return true issues
            items = resp.json()
            return [item for item in items if "pull_request" not in item]

    async def fetch_contributors(self, token: str, repo_full_name: str) -> List[Dict[str, Any]]:
        headers = self._get_headers(token)
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.base_url}/repos/{repo_full_name}/contributors?per_page=50", headers=headers)
            if resp.status_code != 200:
                logger.error(f"[GitHubProvider] Failed to fetch contributors for {repo_full_name}: {resp.text}")
                return []
            return resp.json()

    async def register_webhook(self, token: str, repo_full_name: str, callback_url: str, secret: str) -> Optional[int]:
        headers = self._get_headers(token)
        async with httpx.AsyncClient() as client:
            # Check existing hooks to prevent duplicate registrations
            list_resp = await client.get(f"{self.base_url}/repos/{repo_full_name}/hooks?per_page=100", headers=headers)
            if list_resp.status_code == 200:
                for hook in list_resp.json():
                    if hook.get("config", {}).get("url") == callback_url:
                        logger.info(f"[GitHubProvider] Webhook already exists for {repo_full_name} at {callback_url}")
                        return hook["id"]

            # Create new hook
            data = {
                "name": "web",
                "active": True,
                "events": ["push", "pull_request", "issues", "release"],
                "config": {
                    "url": callback_url,
                    "content_type": "json",
                    "secret": secret,
                    "insecure_ssl": "0"
                }
            }
            resp = await client.post(f"{self.base_url}/repos/{repo_full_name}/hooks", json=data, headers=headers)
            if resp.status_code in (201, 200):
                hook_data = resp.json()
                logger.info(f"[GitHubProvider] Registered new webhook for {repo_full_name} with ID {hook_data['id']}")
                return hook_data["id"]
            else:
                logger.error(f"[GitHubProvider] Failed to register webhook for {repo_full_name}: {resp.text}")
                return None
