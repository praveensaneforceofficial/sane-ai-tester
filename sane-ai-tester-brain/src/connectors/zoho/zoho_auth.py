import httpx
from datetime import datetime, timedelta
from typing import Optional
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class ZohoAuth:
    """Zoho OAuth2 Authentication"""
    
    def __init__(self):
        self.access_token: Optional[str] = None
        self.token_expiry: Optional[datetime] = None
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_access_token(self) -> str:
        """Get valid access token"""
        if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.access_token
        
        await self._refresh_token()
        return self.access_token
    
    async def _refresh_token(self):
        """Refresh access token"""
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
            expires_in = data.get("expires_in", 3600)
            self.token_expiry = datetime.now() + timedelta(seconds=expires_in - 300)  # 5 min buffer
            
            logger.info("Zoho token refreshed successfully")
            
        except Exception as e:
            logger.error(f"Failed to refresh Zoho token: {e}")
            raise
    
    async def get_authorization_url(self) -> str:
        """Get authorization URL for initial OAuth"""
        return (
            f"https://accounts.zoho.com/oauth/v2/auth?"
            f"response_type=code&"
            f"client_id={settings.ZOHO_CLIENT_ID}&"
            f"redirect_uri=http://localhost:8000/api/zoho/callback&"
            f"access_type=offline&"
            f"scope=Sprint.fullaccess.all"
        )
    
    async def exchange_code_for_token(self, code: str):
        """Exchange authorization code for tokens"""
        try:
            response = await self.client.post(
                "https://accounts.zoho.com/oauth/v2/token",
                data={
                    "code": code,
                    "client_id": settings.ZOHO_CLIENT_ID,
                    "client_secret": settings.ZOHO_CLIENT_SECRET,
                    "redirect_uri": "http://localhost:8000/api/zoho/callback",
                    "grant_type": "authorization_code"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            self.access_token = data["access_token"]
            self.refresh_token = data.get("refresh_token")
            expires_in = data.get("expires_in", 3600)
            self.token_expiry = datetime.now() + timedelta(seconds=expires_in - 300)
            
            logger.info("Zoho OAuth completed successfully")
            
            # Save refresh token for future use
            if self.refresh_token:
                logger.info(f"New refresh token obtained: {self.refresh_token[:20]}...")
            
        except Exception as e:
            logger.error(f"Token exchange failed: {e}")
            raise
    
    async def close(self):
        await self.client.aclose()

# Singleton instance
zoho_auth = ZohoAuth()