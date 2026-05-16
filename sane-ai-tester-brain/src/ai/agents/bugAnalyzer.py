from typing import Dict, Any, Optional
from ai.llm.openai_client import openai_client
from ai.llm.ollama_client import ollama_client
from config.ai_config import AIConfig
from utils.logger import get_logger

logger = get_logger(__name__)

class BugAnalyzer:
    """Analyze bugs using AI"""
    
    async def analyze_bug(self, error_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze bug and provide insights"""
        try:
            if AIConfig.USE_OPENAI:
                analysis = await openai_client.analyze_error(
                    error=error_data.get('error_message', ''),
                    stack_trace=error_data.get('stack_trace', '')
                )
            else:
                analysis = await ollama_client.analyze_error(
                    error=error_data.get('error_message', ''),
                    stack_trace=error_data.get('stack_trace', '')
                )
            
            if analysis:
                return {
                    "analysis": analysis,
                    "severity": self._determine_severity(error_data),
                    "recommended_action": self._get_recommended_action(error_data)
                }
            
            return {"error": "Analysis failed"}
            
        except Exception as e:
            logger.error(f"Bug analysis failed: {e}")
            return {"error": str(e)}
    
    def _determine_severity(self, error_data: Dict) -> str:
        """Determine bug severity"""
        error_msg = error_data.get('error_message', '').lower()
        
        if any(word in error_msg for word in ['critical', 'fatal', 'security', 'crash']):
            return "Critical"
        elif any(word in error_msg for word in ['exception', 'failed', 'error']):
            return "High"
        elif any(word in error_msg for word in ['warning', 'timeout']):
            return "Medium"
        return "Low"
    
    def _get_recommended_action(self, error_data: Dict) -> str:
        """Get recommended action"""
        error_msg = error_data.get('error_message', '').lower()
        
        if 'timeout' in error_msg:
            return "Increase timeout or optimize performance"
        elif 'connection' in error_msg:
            return "Check network connectivity and API endpoints"
        elif 'assertion' in error_msg:
            return "Review test assertions and expected results"
        elif 'element not found' in error_msg:
            return "Update selectors or wait for elements to load"
        else:
            return "Review logs and retry with debug mode"

# Singleton instance
bug_analyzer = BugAnalyzer()