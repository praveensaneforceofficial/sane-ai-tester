import httpx
from typing import Optional, Dict, Any, List
from config.settings import settings
from config.ai_config import AIConfig
from utils.logger import get_logger

logger = get_logger(__name__)

class OpenAIClient:
    """OpenAI API Client for LLM operations"""
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=60.0)
        self.endpoint = AIConfig.OPENAI_ENDPOINT
        self.headers = AIConfig.OPENAI_HEADERS
        self.model = AIConfig.get_model_name()
        self.temperature = AIConfig.TEMPERATURE
        self.max_tokens = AIConfig.MAX_TOKENS
    
    async def chat_completion(self, messages: List[Dict[str, str]], **kwargs) -> Optional[str]:
        """Get chat completion from OpenAI"""
        if not AIConfig.USE_OPENAI:
            logger.error("OpenAI not configured")
            return None
        
        try:
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": kwargs.get("temperature", self.temperature),
                "max_tokens": kwargs.get("max_tokens", self.max_tokens)
            }
            
            response = await self.client.post(self.endpoint, json=payload, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            return data["choices"][0]["message"]["content"]
            
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return None
    
    async def generate_test_case(self, requirement: str, priority: str, project: str) -> Optional[str]:
        """Generate test case using AI"""
        messages = [
            {"role": "system", "content": "You are an expert QA engineer specializing in test automation."},
            {"role": "user", "content": f"""
                Generate comprehensive test cases for:
                Requirement: {requirement}
                Priority: {priority}
                Project: {project}
                
                Provide test cases in JSON format with: test_id, scenario, steps, expected_results, test_data
            """}
        ]
        
        return await self.chat_completion(messages)
    
    async def analyze_error(self, error: str, stack_trace: str) -> Optional[str]:
        """Analyze error and suggest fixes"""
        messages = [
            {"role": "system", "content": "You are an expert debugger analyzing test failures."},
            {"role": "user", "content": f"""
                Analyze this error and suggest fixes:
                Error: {error}
                Stack Trace: {stack_trace}
                
                Provide: root_cause, suggested_fix, prevention_measures
            """}
        ]
        
        return await self.chat_completion(messages)
    
    async def close(self):
        await self.client.aclose()

# Singleton instance
openai_client = OpenAIClient()