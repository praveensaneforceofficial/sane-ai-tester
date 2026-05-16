from typing import Dict, Any, List
from ai.llm.prompt_templates import prompt_templates
from ai.rag.retriever import rag_retriever
from utils.logger import get_logger

logger = get_logger(__name__)

class PromptService:
    """Service for prompt engineering and improvement"""
    
    async def generate_test_prompt(self, requirement: str, priority: str, project: str) -> str:
        """Generate test case prompt"""
        # Get similar test cases for context
        similar = await rag_retriever.retrieve_similar_test_cases(requirement, limit=3)
        
        context = ""
        if similar:
            context = "\n\nSimilar successful test cases:\n"
            for s in similar:
                context += f"- {s.get('metadata', {}).get('name', 'Unknown')}\n"
        
        prompt = prompt_templates.format_test_case_generation(
            requirement=requirement,
            priority=priority,
            project_name=project,
            project_code=project[:3].upper()
        )
        
        return prompt + context
    
    async def improve_test_prompt(self, test_case: str, error: str) -> str:
        """Improve test prompt based on failure"""
        prompt = prompt_templates.format_test_improvement(
            test_case=test_case,
            error=error,
            has_screenshot=True
        )
        return prompt
    
    async def generate_bug_analysis_prompt(self, description: str, error_log: str) -> str:
        """Generate bug analysis prompt"""
        prompt = prompt_templates.format_bug_analysis(
            description=description,
            error_log=error_log,
            stack_trace="",
            environment="production"
        )
        return prompt

prompt_service = PromptService()