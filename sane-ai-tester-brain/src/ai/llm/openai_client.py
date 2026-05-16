import openai
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class OpenAIClient:
    """Client for interacting with OpenAI API"""
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        if self.api_key:
            self.client = openai.AsyncOpenAI(api_key=self.api_key)
        else:
            self.client = None
            logger.warning("⚠️ OpenAI API Key not provided")
            
    async def chat_completion(self, messages, temperature=None):
        """Get chat completion from OpenAI"""
        if not self.client:
            raise Exception("OpenAI client not initialized")
            
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature or settings.AI_TEMPERATURE,
                max_tokens=settings.OPENAI_MAX_TOKENS
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API Error: {e}")
            raise

# Singleton instance
openai_client = OpenAIClient()