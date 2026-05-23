import httpx
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class OllamaClient:
    """Client for interacting with local Ollama API"""
    
    def __init__(self):
        self.base_url = settings.OLLAMA_URL
        self.model = settings.OLLAMA_MODEL
        
    async def chat_completion(self, messages, temperature=None, source="brain", source_id="brain_agent"):
        """Get chat completion from local Ollama and log token usage"""
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
                
                res_json = response.json()
                response_text = res_json.get('message', {}).get('content', '')
                
                # Extract Ollama token metrics
                prompt_tokens = res_json.get('prompt_eval_count', 0)
                completion_tokens = res_json.get('eval_count', 0)
                total_tokens = prompt_tokens + completion_tokens
                
                return response_text
        except Exception as e:
            success = False
            status_code = getattr(e, 'response', None) and e.response.status_code or 500
            error_message = str(e)
            logger.error(f"Ollama API Error: {e}")
            raise
        finally:
            duration_ms = int((time.time() - start_time) * 1000)
            try:
                usage_data = {
                    "usage_id": f"use-{uuid.uuid4()}",
                    "api_type": "ollama",
                    "api_endpoint": "/api/chat",
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
                logger.error(f"Failed to log Ollama usage to API: {log_err}")

# Singleton instance
ollama_client = OllamaClient()