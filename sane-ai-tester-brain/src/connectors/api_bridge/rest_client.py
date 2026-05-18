import httpx
from typing import Optional, Dict, Any
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class APIRestClient:
    """REST client for API Bridge communication"""
    
    def __init__(self):
        self.base_url = settings.API_URL
        self.is_connected = False
    
    async def get(self, endpoint: str, params: Optional[Dict] = None, silence_404: bool = False) -> Any:
        """GET request to API bridge"""
        try:
            url = f"{self.base_url}{endpoint}"
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                if silence_404 and response.status_code == 404:
                    return None
                response.raise_for_status()
                self.is_connected = True
                return response.json()
        except Exception as e:
            self.is_connected = False
            # Check if it's a 404 client error
            is_404 = False
            if hasattr(e, 'response') and e.response is not None and e.response.status_code == 404:
                is_404 = True
            elif "404" in str(e):
                is_404 = True
                
            if silence_404 and is_404:
                return None
                
            logger.error(f"GET {endpoint} failed: {e}")
            raise
    
    async def post(self, endpoint: str, data: Optional[Dict] = None) -> Any:
        """POST request to API bridge"""
        try:
            url = f"{self.base_url}{endpoint}"
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=data)
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
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.put(url, json=data)
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
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.delete(url)
                response.raise_for_status()
                self.is_connected = True
                return response.json() if response.content else {"status": "deleted"}
        except Exception as e:
            self.is_connected = False
            logger.error(f"DELETE {endpoint} failed: {e}")
            raise
    
    async def close(self):
        """Close HTTP client - no op since we use context managers now"""
        pass

# Singleton instance
api_rest_client = APIRestClient()