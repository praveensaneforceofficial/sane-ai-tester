from typing import Dict, Any, Optional
from ai.llm.openai_client import openai_client
from ai.llm.ollama_client import ollama_client
from ai.rag.retriever import rag_retriever
from ai.agents.testPlanner import test_planner
from ai.agents.bugAnalyzer import bug_analyzer
from config.ai_config import AIConfig
from utils.logger import get_logger

logger = get_logger(__name__)

class AIOrchestratorService:
    """Orchestrate AI operations"""
    
    async def generate_test_prompt(self, url: str) -> str:
        """Generate test prompt using AI"""
        try:
            # Get similar test cases from RAG
            similar = await rag_retriever.retrieve_similar_test_cases(url, limit=3)
            
            context = ""
            if similar:
                context = f"\nSimilar test cases:\n"
                for s in similar:
                    context += f"- {s.get('metadata', {}).get('name', 'Unknown')}\n"
            
            prompt = f"Generate comprehensive test cases for URL: {url}{context}"
            
            if AIConfig.USE_OPENAI:
                response = await openai_client.chat_completion([
                    {"role": "system", "content": "You are a QA engineer generating test cases."},
                    {"role": "user", "content": prompt}
                ])
            else:
                response = await ollama_client.generate(prompt)
            
            return response or f"Test the following URL: {url}"
            
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