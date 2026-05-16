from typing import Dict, Any, List
from datetime import datetime
from ai.llm.openai_client import openai_client
from ai.llm.ollama_client import ollama_client
from config.ai_config import AIConfig
from utils.logger import get_logger

logger = get_logger(__name__)

class ReportGenerator:
    """Generate AI-powered test reports"""
    
    async def generate_summary_report(self, test_results: List[Dict], project_name: str) -> Dict[str, Any]:
        """Generate comprehensive test summary report"""
        total = len(test_results)
        passed = len([t for t in test_results if t.get('status') == 'completed'])
        failed = len([t for t in test_results if t.get('status') == 'failed'])
        skipped = len([t for t in test_results if t.get('status') == 'skipped'])
        
        failed_tests = [t for t in test_results if t.get('status') == 'failed']
        failed_details = "\n".join([
            f"- {t.get('name')}: {t.get('error', 'Unknown error')}"
            for t in failed_tests[:10]
        ])
        
        try:
            if AIConfig.USE_OPENAI:
                summary = await openai_client.chat_completion([
                    {"role": "system", "content": "You are a QA report generator."},
                    {"role": "user", "content": f"""
                        Generate test summary report:
                        Project: {project_name}
                        Total: {total}
                        Passed: {passed}
                        Failed: {failed}
                        Skipped: {skipped}
                        
                        Failed Tests:
                        {failed_details}
                        
                        Provide:
                        1. Overall status
                        2. Critical issues
                        3. Recommendations
                        4. Risk assessment
                    """}
                ])
            else:
                summary = await ollama_client.generate(f"""
                    Generate test summary report for {project_name}:
                    Total: {total}, Passed: {passed}, Failed: {failed}, Skipped: {skipped}
                    Failed tests: {failed_details}
                    
                    Provide overall status, critical issues, recommendations, risk assessment.
                """)
            
            report = {
                "report_id": f"RPT_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "project_name": project_name,
                "timestamp": datetime.now().isoformat(),
                "total_tests": total,
                "passed": passed,
                "failed": failed,
                "skipped": skipped,
                "pass_rate": round((passed / total * 100) if total > 0 else 0, 2),
                "summary": summary if summary else "Report generation failed",
                "failed_tests": failed_tests[:20]  # Limit to 20
            }
            
            return report
            
        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            return self._generate_fallback_report(test_results, project_name)
    
    def _generate_fallback_report(self, test_results: List[Dict], project_name: str) -> Dict[str, Any]:
        """Generate fallback report without AI"""
        total = len(test_results)
        passed = len([t for t in test_results if t.get('status') == 'completed'])
        failed = len([t for t in test_results if t.get('status') == 'failed'])
        
        return {
            "report_id": f"RPT_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "project_name": project_name,
            "timestamp": datetime.now().isoformat(),
            "total_tests": total,
            "passed": passed,
            "failed": failed,
            "skipped": total - passed - failed,
            "pass_rate": round((passed / total * 100) if total > 0 else 0, 2),
            "summary": f"Test execution completed. {passed} passed, {failed} failed.",
            "failed_tests": [t for t in test_results if t.get('status') == 'failed'][:20]
        }

# Singleton instance
report_generator = ReportGenerator()