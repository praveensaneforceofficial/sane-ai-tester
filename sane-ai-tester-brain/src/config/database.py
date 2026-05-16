from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class DatabaseConfig:
    """Database configuration (No direct DB connection - all via API bridge)"""
    
    def __init__(self):
        self.api_url = settings.API_URL
        self.is_connected = False
    
    async def check_connection(self):
        """Check if API bridge is accessible"""
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.api_url}/api/health")
                if response.status_code == 200:
                    self.is_connected = True
                    logger.info("✅ API Bridge connection verified")
                    return True
        except Exception as e:
            logger.error(f"API Bridge connection failed: {e}")
            self.is_connected = False
            return False
    
    def get_status(self):
        """Get database connection status"""
        return {
            "type": "api_bridge",
            "url": self.api_url,
            "connected": self.is_connected,
            "message": "Database operations handled by API Bridge" if self.is_connected else "Not connected to API Bridge"
        }

database_config = DatabaseConfig()