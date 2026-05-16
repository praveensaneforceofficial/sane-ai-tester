import httpx
from typing import Optional, List, Dict, Any
from config.settings import settings
from config.ai_config import AIConfig
from utils.logger import get_logger

logger = get_logger(__name__)

class OllamaClient:
    """Ollama Local LLM Client"""
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=120.0)
        self.base_url = settings.OLLAMA_URL
        self.model = settings.OLLAMA_MODEL
        self.temperature = settings.AI_TEMPERATURE
    
    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """Generate text using Ollama"""
        if not self.base_url:
            logger.warning("Ollama URL not configured")
            return None
        
        try:
            full_prompt = ""
            if system_prompt:
                full_prompt = f"System: {system_prompt}\n\nUser: {prompt}\n\nAssistant:"
            else:
                full_prompt = prompt
            
            payload = {
                "model": self.model,
                "prompt": full_prompt,
                "temperature": self.temperature,
                "stream": False
            }
            
            response = await self.client.post(f"{self.base_url}/api/generate", json=payload)
            response.raise_for_status()
            data = response.json()
            
            return data.get("response", "")
            
        except Exception as e:
            logger.error(f"Ollama API error: {e}")
            return None
    
    async def chat(self, messages: List[Dict[str, str]]) -> Optional[str]:
        """Chat with Ollama"""
        prompt = ""
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                prompt += f"System: {content}\n\n"
            elif role == "user":
                prompt += f"User: {content}\n\n"
            elif role == "assistant":
                prompt += f"Assistant: {content}\n\n"
        
        prompt += "Assistant:"
        return await self.generate(prompt)
    
    async def generate_test_case(self, requirement: str, priority: str, project: str) -> Optional[str]:
        """Generate test case using Ollama"""
        prompt = f"""
        Generate comprehensive test cases for:
        Requirement: {requirement}
        Priority: {priority}
        Project: {project}
        
        Provide test cases in JSON format with: test_id, scenario, steps, expected_results, test_data
        """
        return await self.generate(prompt)
    
    async def analyze_error(self, error: str, stack_trace: str) -> Optional[str]:
        """Analyze error using Ollama"""
        prompt = f"""
        Analyze this error and suggest fixes:
        Error: {error}
        Stack Trace: {stack_trace}
        
        Provide: root_cause, suggested_fix, prevention_measures
        """
        return await self.generate(prompt)
    
    async def close(self):
        await self.client.aclose()

# Singleton instance
ollama_client = OllamaClient()