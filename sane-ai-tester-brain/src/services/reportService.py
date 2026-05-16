from typing import Dict, Any, List, Optional
from datetime import datetime
from services.apiBridgeService import api_bridge_service
from ai.agents.reportGenerator import report_generator
from utils.logger import get_logger

logger = get_logger(__name__)

class ReportService:
    """Service for report generation and management"""
    
    async def generate_summary_report(self, project_name: Optional[str] = None, 
                                       start_date: Optional[str] = None,
                                       end_date: Optional[str] = None) -> Dict[str, Any]:
        """Generate summary report"""
        try:
            # Gather test results
            workers = await api_bridge_service.get_workers()
            all_tasks = []
            
            for worker in workers:
                tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'], limit=300)
                
                # Filter by date range if specified
                if start_date:
                    tasks = [t for t in tasks if t.get('created_at', '') >= start_date]
                if end_date:
                    tasks = [t for t in tasks if t.get('created_at', '') <= end_date]
                
                all_tasks.extend(tasks)
            
            # Generate AI report
            report = await report_generator.generate_summary_report(
                all_tasks,
                project_name or "All Projects"
            )
            
            return report
            
        except Exception as e:
            logger.error(f"Failed to generate summary report: {e}")
            return self._generate_fallback_report(all_tasks if 'all_tasks' in locals() else [])
    
    async def get_failed_tests(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get failed tests"""
        try:
            workers = await api_bridge_service.get_workers()
            failed_tests = []
            
            for worker in workers:
                tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'], limit=200)
                failed = [t for t in tasks if t.get('status') == 'failed']
                
                for task in failed:
                    failed_tests.append({
                        "id": task.get('id'),
                        "worker": worker.get('nickname'),
                        "prompt": task.get('prompt'),
                        "error": task.get('result_data', {}).get('error', 'Unknown'),
                        "timestamp": task.get('created_at')
                    })
            
            failed_tests.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            return failed_tests[:limit]
            
        except Exception as e:
            logger.error(f"Failed to get failed tests: {e}")
            return []
    
    async def export_report(self, report_data: Dict[str, Any]) -> str:
        """Export report to file"""
        import json
        import os
        from config.settings import settings
        
        filename = f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = os.path.join(settings.REPORT_PATH, filename)
        
        os.makedirs(settings.REPORT_PATH, exist_ok=True)
        
        with open(filepath, 'w') as f:
            json.dump(report_data, f, indent=2)
        
        return filepath
    
    def _generate_fallback_report(self, tasks: List[Dict]) -> Dict[str, Any]:
        """Generate fallback report without AI"""
        total = len(tasks)
        passed = len([t for t in tasks if t.get('status') == 'completed'])
        failed = len([t for t in tasks if t.get('status') == 'failed'])
        
        return {
            "report_id": f"RPT_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "total_tests": total,
            "passed": passed,
            "failed": failed,
            "skipped": total - passed - failed,
            "pass_rate": round((passed / total * 100) if total > 0 else 0, 2),
            "summary": f"Report generated. {passed} passed, {failed} failed.",
            "failed_tests": [t for t in tasks if t.get('status') == 'failed'][:20]
        }

report_service = ReportService()