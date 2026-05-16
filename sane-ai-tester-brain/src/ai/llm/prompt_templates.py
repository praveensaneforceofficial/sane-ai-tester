from constants.prompts import (
    TEST_CASE_GENERATION,
    TEST_IMPROVEMENT,
    BUG_ANALYSIS,
    TEST_SUMMARY,
    RAG_QUERY
)

class PromptTemplates:
    """Manage and format AI prompts"""
    
    @staticmethod
    def format_test_case_generation(requirement: str, priority: str, project_name: str, project_code: str) -> str:
        """Format test case generation prompt"""
        return TEST_CASE_GENERATION.format(
            requirement=requirement,
            priority=priority,
            project_name=project_name,
            project_code=project_code
        )
    
    @staticmethod
    def format_test_improvement(test_case: str, error: str, has_screenshot: bool) -> str:
        """Format test improvement prompt"""
        return TEST_IMPROVEMENT.format(
            test_case=test_case,
            error=error,
            has_screenshot="Yes" if has_screenshot else "No"
        )
    
    @staticmethod
    def format_bug_analysis(description: str, error_log: str, stack_trace: str, environment: str) -> str:
        """Format bug analysis prompt"""
        return BUG_ANALYSIS.format(
            description=description,
            error_log=error_log,
            stack_trace=stack_trace,
            environment=environment
        )
    
    @staticmethod
    def format_test_summary(project_name: str, date: str, total: int, passed: int, 
                           failed: int, skipped: int, duration: float, failed_tests_details: str) -> str:
        """Format test summary prompt"""
        return TEST_SUMMARY.format(
            project_name=project_name,
            date=date,
            total=total,
            passed=passed,
            failed=failed,
            skipped=skipped,
            duration=duration,
            failed_tests_details=failed_tests_details
        )
    
    @staticmethod
    def format_rag_query(similar_cases: str, new_case: str) -> str:
        """Format RAG query prompt"""
        return RAG_QUERY.format(
            similar_cases=similar_cases,
            new_case=new_case
        )

prompt_templates = PromptTemplates()