import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class ZohoClient:
    """Zoho Sprint API Client"""
    
    def __init__(self):
        self.base_url = settings.ZOHO_API_BASE
        self.org_id = settings.ZOHO_ORG_ID
        self.access_token = None
        self.token_expiry = None
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_access_token(self) -> str:
        """Get or refresh access token"""
        if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.access_token
        
        # Refresh token
        try:
            response = await self.client.post(
                "https://accounts.zoho.com/oauth/v2/token",
                data={
                    "refresh_token": settings.ZOHO_REFRESH_TOKEN,
                    "client_id": settings.ZOHO_CLIENT_ID,
                    "client_secret": settings.ZOHO_CLIENT_SECRET,
                    "grant_type": "refresh_token"
                }
            )
            response.raise_for_status()
            data = response.json()
            self.access_token = data["access_token"]
            self.token_expiry = datetime.now().replace(
                hour=datetime.now().hour + 1
            )
            return self.access_token
        except Exception as e:
            logger.error(f"Failed to get Zoho token: {e}")
            raise
    
    async def _request(self, method: str, endpoint: str, data: Optional[Dict] = None):
        """Make authenticated request to Zoho API"""
        token = await self.get_access_token()
        headers = {
            "Authorization": f"Zoho-oauthtoken {token}",
            "Content-Type": "application/json"
        }
        
        url = f"{self.base_url}/org/{self.org_id}{endpoint}"
        
        try:
            response = await self.client.request(
                method, url, json=data, headers=headers
            )
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Zoho API {method} {endpoint} failed: {e}")
            raise
    
    async def get_sprint_items(self, sprint_id: str) -> List[Dict]:
        """Get all items in a sprint"""
        response = await self._request("GET", f"/sprints/{sprint_id}/items")
        return response.get("items", [])
    
    async def get_item_details(self, item_id: str) -> Dict:
        """Get specific item details"""
        return await self._request("GET", f"/items/{item_id}")
    
    async def update_item_status(self, item_id: str, status: str) -> Dict:
        """Update item status"""
        return await self._request("PUT", f"/items/{item_id}", {"status": status})
    
    async def create_test_task(self, item_data: Dict) -> Dict:
        """Create test task from Zoho item"""
        return await self._request("POST", "/items", item_data)
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

# Singleton instance
zoho_client = ZohoClient()