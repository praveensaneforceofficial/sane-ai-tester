from typing import Dict, Any, Optional, List
from ai.llm.openai_client import openai_client
from ai.llm.ollama_client import ollama_client
from ai.rag.retriever import rag_retriever
from config.ai_config import AIConfig
from utils.logger import get_logger

logger = get_logger(__name__)

class TestImprover:
    """Improve test cases using AI and historical data"""
    
    async def improve_test_case(self, test_case: Dict[str, Any], error: Optional[str] = None) -> Dict[str, Any]:
        """Improve test case based on failures or best practices"""
        try:
            # Get similar successful test cases
            similar_cases = await rag_retriever.retrieve_similar_test_cases(
                test_case.get('name', ''),
                limit=3
            )
            
            context = self._build_context(similar_cases, error)
            
            prompt = f"""
            Improve the following test case:
            
            Current Test Case:
            Name: {test_case.get('name')}
            Steps: {test_case.get('steps')}
            Expected: {test_case.get('expected_results')}
            
            {context}
            
            Provide improved version with:
            1. Better step-by-step instructions
            2. Additional validation points
            3. Edge cases to cover
            4. Suggested test data
            """
            
            if AIConfig.USE_OPENAI:
                response = await openai_client.chat_completion([
                    {"role": "system", "content": "You are an expert QA engineer improving test cases."},
                    {"role": "user", "content": prompt}
                ])
            else:
                response = await ollama_client.generate(prompt)
            
            if response:
                test_case['improved_steps'] = response
                test_case['improved_at'] = datetime.now().isoformat()
            
            return test_case
            
        except Exception as e:
            logger.error(f"Test improvement failed: {e}")
            return test_case
    
    def _build_context(self, similar_cases: List[Dict], error: Optional[str]) -> str:
        """Build context from similar cases and errors"""
        context = ""
        
        if similar_cases:
            context += "\nSimilar successful test cases:\n"
            for case in similar_cases:
                context += f"- {case.get('metadata', {}).get('name', 'Unknown')}\n"
        
        if error:
            context += f"\nPrevious failure error:\n{error}\n"
            context += "\nFocus on fixing the above error.\n"
        
        return context
    
    async def suggest_improvements(self, test_history: List[Dict]) -> List[str]:
        """Suggest improvements based on test history"""
        suggestions = []
        
        # Analyze failure patterns
        failures = [t for t in test_history if t.get('status') == 'failed']
        if len(failures) > 5:
            suggestions.append("High failure rate detected. Consider reviewing test environment setup.")
        
        # Analyze execution time
        slow_tests = [t for t in test_history if t.get('duration', 0) > 30]
        if slow_tests:
            suggestions.append(f"{len(slow_tests)} tests are taking >30 seconds. Consider optimization.")
        
        # Analyze flaky tests
        flaky = self._detect_flaky_tests(test_history)
        if flaky:
            suggestions.append(f"Flaky tests detected: {', '.join(flaky[:3])}. Add retry logic or stabilize.")
        
        return suggestions
    
    def _detect_flaky_tests(self, test_history: List[Dict]) -> List[str]:
        """Detect flaky tests (alternating pass/fail)"""
        test_runs = {}
        for test in test_history:
            name = test.get('name')
            if name not in test_runs:
                test_runs[name] = []
            test_runs[name].append(test.get('status'))
        
        flaky = []
        for name, statuses in test_runs.items():
            if len(statuses) > 3 and len(set(statuses)) > 1:
                flaky.append(name)
        
        return flaky

# Singleton instance
test_improver = TestImprover()