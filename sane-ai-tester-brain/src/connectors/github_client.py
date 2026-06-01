import httpx
from typing import Optional
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class GitHubClient:
    """Client for GitHub API communication"""
    
    def __init__(self):
        self.base_url = "https://api.github.com"
        self.token = settings.GITHUB_TOKEN
        
    @property
    def headers(self) -> dict:
        headers = {
            "Accept": "application/vnd.github.v3+json",
        }
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        return headers
    
    async def post_pr_comment(self, repository: str, pr_number: int, comment: str) -> bool:
        """
        Post a comment to a GitHub pull request.
        repository should be in format 'owner/repo'
        """
        if not self.token:
            logger.warning("GITHUB_TOKEN not configured. Skipping PR comment.")
            return False
            
        endpoint = f"/repos/{repository}/issues/{pr_number}/comments"
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    url,
                    headers=self.headers,
                    json={"body": comment}
                )
                response.raise_for_status()
                logger.info(f"Successfully posted comment to PR #{pr_number} in {repository}")
                return True
        except Exception as e:
            logger.error(f"Failed to post comment to PR #{pr_number} in {repository}: {e}")
            return False

github_client = GitHubClient()
