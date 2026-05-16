from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class AIConfig:
    """AI Model Configuration"""
    
    # Model selection
    USE_OPENAI = bool(settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip())
    USE_OLLAMA = bool(settings.OLLAMA_URL and settings.OLLAMA_URL.strip())
    
    # Model settings
    TEMPERATURE = settings.AI_TEMPERATURE
    MAX_TOKENS = settings.OPENAI_MAX_TOKENS if USE_OPENAI else settings.OLLAMA_MAX_TOKENS
    MAX_RETRIES = settings.AI_MAX_RETRIES
    
    # Model endpoints
    OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"
    OLLAMA_ENDPOINT = f"{settings.OLLAMA_URL}/api/generate" if settings.OLLAMA_URL else ""
    
    # Headers
    OPENAI_HEADERS = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json"
    } if settings.OPENAI_API_KEY else {}
    
    @classmethod
    def get_model_name(cls):
        if cls.USE_OPENAI:
            return settings.OPENAI_MODEL
        return settings.OLLAMA_MODEL
    
    @classmethod
    def get_active_provider(cls):
        if cls.USE_OPENAI:
            return "openai"
        elif cls.USE_OLLAMA:
            return "ollama"
        return "none"
    
    @classmethod
    def validate_config(cls):
        """Validate AI configuration"""
        if not cls.USE_OPENAI and not cls.USE_OLLAMA:
            logger.warning("No AI provider configured. AI features will be disabled.")
            return False
        elif cls.USE_OPENAI:
            logger.info(f"✅ AI Provider: OpenAI (Model: {cls.get_model_name()})")
        elif cls.USE_OLLAMA:
            logger.info(f"✅ AI Provider: Ollama (Model: {cls.get_model_name()})")
        return True

# Validate on import
AIConfig.validate_config()