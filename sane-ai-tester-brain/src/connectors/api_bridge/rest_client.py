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

    async def post_long(self, endpoint: str, data: Optional[Dict] = None, timeout: float = 180.0) -> Any:
        """POST request with extended timeout for long-running operations like Puppeteer"""
        try:
            url = f"{self.base_url}{endpoint}"
            async with httpx.AsyncClient(timeout=timeout) as long_client:
                response = await long_client.post(url, json=data)
                response.raise_for_status()
                self.is_connected = True
                return response.json()
        except Exception as e:
            self.is_connected = False
            logger.error(f"POST_LONG {endpoint} failed: {e}")
            raise

    async def put(self, endpoint: str, data: Optional[Dict] = None) -> Any:
        """PUT request to API bridge"""
        try:
            url = f"{self.base_url}{endpoint}"
            response = await self.client.put(url, json=data)
            response.raise_for_status()
            self.is_connected = True
            return response.json()
        except Exception as e:
            self.is_connected = False
            logger.error(f"PUT {endpoint} failed: {e}")
            raise

    async def delete(self, endpoint: str) -> Any:
        """DELETE request to API bridge"""
        try:
            url = f"{self.base_url}{endpoint}"
            response = await self.client.delete(url)
            response.raise_for_status()
            self.is_connected = True
            return response.json() if response.content else {"status": "deleted"}
        except Exception as e:
            self.is_connected = False
            logger.error(f"DELETE {endpoint} failed: {e}")
            raise
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

# Singleton instance
api_rest_client = APIRestClient()