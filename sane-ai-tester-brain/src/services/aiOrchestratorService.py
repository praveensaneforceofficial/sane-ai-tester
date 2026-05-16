from typing import Dict, Any, Optional, List
from ai.llm.openai_client import openai_client
from ai.llm.ollama_client import ollama_client
from ai.agents.testPlanner import test_planner
from ai.agents.bugAnalyzer import bug_analyzer
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class AIOrchestratorService:
    """Orchestrate AI operations using chat_completion standard"""
    
    async def generate_test_prompt(self, url: str) -> str:
        """Generate test prompt using AI"""
        try:
            prompt = f"You are a Senior QA Engineer. Generate a comprehensive test execution plan for the following URL: {url}. Provide a numbered list of steps."
            
            messages = [
                {"role": "system", "content": "You are a QA automation expert."},
                {"role": "user", "content": prompt}
            ]
            
            # Prefer OpenAI if key exists, else fallback to Ollama
            if settings.OPENAI_API_KEY:
                response = await openai_client.chat_completion(messages)
            else:
                response = await ollama_client.chat_completion(messages)
            
            return response or f"Perform full functional testing on {url}"
            
        except Exception as e:
            logger.error(f"Failed to generate test prompt: {e}")
            return f"Test the following URL: {url}"
    
    async def generate_test_case(self, requirement: Dict[str, Any]) -> Dict[str, Any]:
        """Generate test case from requirement"""
        try:
            test_cases = await test_planner.generate_test_plan([requirement])
            return test_cases[0] if test_cases else requirement
        except Exception as e:
            logger.error(f"Failed to generate test case: {e}")
            return requirement
    
    async def analyze_error(self, error: str, stack_trace: str) -> Dict[str, Any]:
        """Analyze error and provide fix suggestions"""
        try:
            return await bug_analyzer.analyze_bug({
                "error_message": error,
                "stack_trace": stack_trace
            })
        except Exception as e:
            logger.error(f"Failed to analyze error: {e}")
            return {"analysis": "Analysis failed", "severity": "Unknown"}

ai_orchestrator = AIOrchestratorService()