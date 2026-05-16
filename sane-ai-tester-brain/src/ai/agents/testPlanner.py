from typing import List, Dict, Any
from ai.llm.openai_client import openai_client
from ai.llm.ollama_client import ollama_client
from config.ai_config import AIConfig
from utils.logger import get_logger

logger = get_logger(__name__)

class TestPlanner:
    """Plan test cases using AI"""
    
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
            if AIConfig.USE_OPENAI:
                response = await openai_client.generate_test_case(
                    requirement=requirement.get('description', ''),
                    priority=requirement.get('priority', 'Medium'),
                    project=requirement.get('project', 'Unknown')
                )
            else:
                response = await ollama_client.generate_test_case(
                    requirement=requirement.get('description', ''),
                    priority=requirement.get('priority', 'Medium'),
                    project=requirement.get('project', 'Unknown')
                )
            
            if response:
                # Parse JSON response
                import json
                try:
                    test_cases = json.loads(response)
                    if isinstance(test_cases, list):
                        return test_cases
                    elif isinstance(test_cases, dict):
                        return [test_cases]
                except:
                    logger.warning(f"Failed to parse AI response as JSON: {response[:100]}")
            
            return []
            
        except Exception as e:
            logger.error(f"Test case generation failed: {e}")
            return []
    
    async def prioritize_test_cases(self, test_cases: List[Dict]) -> List[Dict]:
        """Prioritize test cases"""
        # Sort by priority
        priority_order = {"High": 0, "Medium": 1, "Low": 2}
        test_cases.sort(key=lambda x: priority_order.get(x.get('priority', 'Medium'), 1))
        return test_cases

# Singleton instance
test_planner = TestPlanner()