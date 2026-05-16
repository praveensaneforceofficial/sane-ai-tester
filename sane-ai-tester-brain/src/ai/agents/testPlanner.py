from typing import List, Dict, Any
import json
from ai.llm.openai_client import openai_client
from ai.llm.ollama_client import ollama_client
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class TestPlanner:
    """Plan test cases using AI via standardized chat interface"""
    
    async def generate_test_plan(self, requirements: List[Dict]) -> List[Dict]:
        """Generate test plan from requirements"""
        test_plan = []
        for req in requirements:
            test_cases = await self._generate_test_cases(req)
            test_plan.extend(test_cases)
        return test_plan
    
    async def _generate_test_cases(self, requirement: Dict) -> List[Dict]:
        """Generate test cases for single requirement"""
        try:
            prompt = f"""
            Generate a JSON array of test cases for the following requirement:
            Description: {requirement.get('description', '')}
            Priority: {requirement.get('priority', 'Medium')}
            
            Return only valid JSON in this format:
            [
              {{"title": "Test name", "steps": ["step 1", "step 2"], "expected_result": "result"}}
            ]
            """
            
            messages = [{"role": "user", "content": prompt}]
            
            if settings.OPENAI_API_KEY:
                response = await openai_client.chat_completion(messages)
            else:
                response = await ollama_client.chat_completion(messages)
            
            if response:
                try:
                    # Basic JSON extraction in case AI adds markdown
                    start = response.find('[')
                    end = response.rfind(']') + 1
                    if start != -1 and end != -1:
                        test_cases = json.loads(response[start:end])
                        return test_cases if isinstance(test_cases, list) else [test_cases]
                except Exception as e:
                    logger.warning(f"Failed to parse AI JSON: {e}")
            
            return []
            
        except Exception as e:
            logger.error(f"Test case generation failed: {e}")
            return []

# Singleton instance
test_planner = TestPlanner()