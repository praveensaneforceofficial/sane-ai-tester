import httpx
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class OllamaClient:
    """Client for interacting with local Ollama API"""
    
    def __init__(self):
        self.base_url = settings.OLLAMA_URL
        self.model = settings.OLLAMA_MODEL
        
    async def chat_completion(self, messages, temperature=None):
        """Get chat completion from local Ollama"""
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                url = f"{self.base_url}/api/chat"
                payload = {
                    "model": self.model,
                    "messages": messages,
                    "options": {
                        "temperature": temperature or settings.AI_TEMPERATURE,
                        "num_predict": settings.OLLAMA_MAX_TOKENS
                    },
                    "stream": False
                }
                response = await client.post(url, json=payload)
                response.raise_for_status()
                return response.json().get('message', {}).get('content', '')
        except Exception as e:
            logger.error(f"Ollama API Error: {e}")
            raise

# Singleton instance
ollama_client = OllamaClient()