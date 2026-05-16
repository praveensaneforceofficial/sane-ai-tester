import httpx
from typing import Optional, Dict, Any
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class APIRestClient:
    """REST client for API Bridge communication"""
    
    def __init__(self):
        self.base_url = settings.API_URL
        self.client = httpx.AsyncClient(timeout=30.0)
        self.is_connected = False
    
    async def get(self, endpoint: str, params: Optional[Dict] = None) -> Any:
        """GET request to API bridge"""
        try:
            url = f"{self.base_url}{endpoint}"
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            self.is_connected = True
            return response.json()
        except Exception as e:
            self.is_connected = False
            logger.error(f"GET {endpoint} failed: {e}")
            raise
    
    async def post(self, endpoint: str, data: Optional[Dict] = None) -> Any:
        """POST request to API bridge"""
        try:
            url = f"{self.base_url}{endpoint}"
            response = await self.client.post(url, json=data)
            response.raise_for_status()
            self.is_connected = True
            return response.json()
        except Exception as e:
            self.is_connected = False
            logger.error(f"POST {endpoint} failed: {e}")
            raise
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

# Singleton instance
api_rest_client = APIRestClient()