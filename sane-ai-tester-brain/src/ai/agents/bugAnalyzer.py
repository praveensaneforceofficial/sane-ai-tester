from typing import Dict, Any, Optional
from ai.llm.openai_client import openai_client
from ai.llm.ollama_client import ollama_client
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class BugAnalyzer:
    """Analyze bugs using AI via standardized chat interface"""
    
    async def analyze_bug(self, error_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze bug and provide insights"""
        try:
            error_msg = error_data.get('error_message', '')
            stack_trace = error_data.get('stack_trace', '')
            
            prompt = f"Analyze the following software error and provide a concise summary and potential fix:\nError: {error_msg}\nStack Trace: {stack_trace}"
            messages = [{"role": "user", "content": prompt}]
            
            if settings.OPENAI_API_KEY:
                analysis = await openai_client.chat_completion(messages)
            else:
                analysis = await ollama_client.chat_completion(messages)
            
            return {
                "analysis": analysis or "No analysis available",
                "severity": self._determine_severity(error_data),
                "recommended_action": self._get_recommended_action(error_data)
            }
            
        except Exception as e:
            logger.error(f"Bug analysis failed: {e}")
            return {"error": str(e)}
    
    def _determine_severity(self, error_data: Dict) -> str:
        error_msg = error_data.get('error_message', '').lower()
        if any(word in error_msg for word in ['critical', 'fatal', 'security', 'crash']):
            return "Critical"
        elif any(word in error_msg for word in ['exception', 'failed', 'error']):
            return "High"
        return "Medium"
    
    def _get_recommended_action(self, error_data: Dict) -> str:
        error_msg = error_data.get('error_message', '').lower()
        if 'timeout' in error_msg:
            return "Increase timeout or optimize performance"
        elif 'connection' in error_msg:
            return "Check network connectivity"
        return "Review logs and retry"

# Singleton instance
bug_analyzer = BugAnalyzer()