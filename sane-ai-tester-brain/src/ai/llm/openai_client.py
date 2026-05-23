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
            
    async def chat_completion(self, messages, temperature=None, source="brain", source_id="brain_agent"):
        """Get chat completion from OpenAI and log token usage"""
        if not self.client:
            raise Exception("OpenAI client not initialized")
            
        import time
        import uuid
        from services.apiBridgeService import api_bridge_service

        start_time = time.time()
        status_code = 200
        success = True
        error_message = None
        response_text = ""
        prompt_tokens = 0
        completion_tokens = 0
        total_tokens = 0

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature or settings.AI_TEMPERATURE,
                max_tokens=settings.OPENAI_MAX_TOKENS
            )
            response_text = response.choices[0].message.content
            
            if response.usage:
                prompt_tokens = response.usage.prompt_tokens
                completion_tokens = response.usage.completion_tokens
                total_tokens = response.usage.total_tokens
                
            return response_text
        except Exception as e:
            success = False
            status_code = 500
            error_message = str(e)
            logger.error(f"OpenAI API Error: {e}")
            raise
        finally:
            duration_ms = int((time.time() - start_time) * 1000)
            try:
                usage_data = {
                    "usage_id": f"use-{uuid.uuid4()}",
                    "api_type": "openai",
                    "api_endpoint": "chat.completions.create",
                    "request_type": "chat_completion",
                    "request_data": {"messages": messages, "model": self.model},
                    "response_data": {"content": response_text} if success else None,
                    "tokens_used": total_tokens,
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "request_duration": duration_ms,
                    "status_code": status_code,
                    "success": success,
                    "error_message": error_message,
                    "source": source,
                    "source_id": source_id
                }
                await api_bridge_service.log_ai_usage(usage_data)
            except Exception as log_err:
                logger.error(f"Failed to log OpenAI usage to API: {log_err}")

# Singleton instance
openai_client = OpenAIClient()