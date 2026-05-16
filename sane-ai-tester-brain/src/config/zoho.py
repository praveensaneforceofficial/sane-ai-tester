from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class ZohoConfig:
    """Zoho Sprint API Configuration"""
    
    # API endpoints
    BASE_URL = settings.ZOHO_API_BASE
    AUTH_URL = "https://accounts.zoho.com/oauth/v2/token"
    AUTH_URL_WEB = "https://accounts.zoho.com/oauth/v2/auth"
    
    # Credentials from .env
    CLIENT_ID = settings.ZOHO_CLIENT_ID
    CLIENT_SECRET = settings.ZOHO_CLIENT_SECRET
    REFRESH_TOKEN = settings.ZOHO_REFRESH_TOKEN
    ORG_ID = settings.ZOHO_ORG_ID
    
    # Scopes required for Sprint access
    SCOPES = [
        "Sprint.fullaccess.all",
        "Sprint.portals.READ",
        "aaaserver.profile.READ"
    ]
    
    # API rate limits
    RATE_LIMIT = 100  # requests per minute
    RATE_LIMIT_WINDOW = 60  # seconds
    
    # Timeouts
    CONNECTION_TIMEOUT = 30
    READ_TIMEOUT = 60
    
    @classmethod
    def get_auth_url(cls, redirect_uri: str) -> str:
        """Get authorization URL for OAuth flow"""
        scope = " ".join(cls.SCOPES)
        return f"{cls.AUTH_URL_WEB}?response_type=code&client_id={cls.CLIENT_ID}&redirect_uri={redirect_uri}&access_type=offline&scope={scope}"
    
    @classmethod
    def validate_config(cls) -> bool:
        """Validate Zoho configuration"""
        if not cls.CLIENT_ID or cls.CLIENT_ID == "your_client_id_here":
            logger.warning("⚠️ Zoho Client ID not configured")
            return False
        if not cls.CLIENT_SECRET or cls.CLIENT_SECRET == "your_client_secret_here":
            logger.warning("⚠️ Zoho Client Secret not configured")
            return False
        if not cls.REFRESH_TOKEN or cls.REFRESH_TOKEN == "your_refresh_token_here":
            logger.warning("⚠️ Zoho Refresh Token not configured")
            return False
        if not cls.ORG_ID or cls.ORG_ID == "your_organization_id_here":
            logger.warning("⚠️ Zoho Org ID not configured")
            return False
        
        logger.info("✅ Zoho configuration validated")
        return True

# Validate on import
ZohoConfig.validate_config()