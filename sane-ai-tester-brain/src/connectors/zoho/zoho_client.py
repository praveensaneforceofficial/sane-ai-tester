import httpx
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class ZohoClient:
    """Client for interacting with Zoho Sprint API"""
    
    def __init__(self):
        self.base_url = settings.ZOHO_API_BASE
        self.headers = {
            "Authorization": f"Zoho-oauthtoken {settings.ZOHO_REFRESH_TOKEN}"
        }
    
    async def get_projects(self):
        """Fetch all projects from Zoho Sprints"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/projects"
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                return response.json().get('projects', [])
        except Exception as e:
            logger.error(f"Zoho API Error (Projects): {e}")
            return []

    async def get_tickets(self, project_id):
        """Fetch all tickets (items) for a project"""
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/projects/{project_id}/items"
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                return response.json().get('items', [])
        except Exception as e:
            logger.error(f"Zoho API Error (Tickets for {project_id}): {e}")
            return []

# Singleton instance
zoho_client = ZohoClient()