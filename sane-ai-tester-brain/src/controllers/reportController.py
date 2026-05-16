from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import HTTPException
from ai.agents.reportGenerator import report_generator
from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger

logger = get_logger(__name__)

class ReportController:
    """Controller for report generation"""
    
    async def generate_test_report(self, project_name: Optional[str] = None) -> Dict[str, Any]:
        """Generate test report"""
        try:
            # Gather all test results
            all_tasks = []
            workers = await api_bridge_service.get_workers()
            
            for worker in workers:
                tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'], limit=200)
                all_tasks.extend(tasks)
            
            # Filter by project if specified
            if project_name:
                all_tasks = [t for t in all_tasks if project_name.lower() in t.get('prompt', '').lower()]
            
            # Generate report using AI
            report = await report_generator.generate_summary_report(all_tasks, project_name or "All Projects")
            
            return report
            
        except Exception as e:
            logger.error(f"Failed to generate report: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def get_failed_tests_report(self, limit: int = 100) -> Dict[str, Any]:
        """Get failed tests report"""
        try:
            failed_tests = []
            workers = await api_bridge_service.get_workers()
            
            for worker in workers:
                tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'], limit=200)
                failed = [t for t in tasks if t.get('status') == 'failed']
                
                for task in failed:
                    failed_tests.append({
                        "task_id": task.get('id'),
                        "worker": worker.get('nickname'),
                        "prompt": task.get('prompt'),
                        "error": task.get('result_data', {}).get('error', 'Unknown error'),
                        "timestamp": task.get('created_at')
                    })
            
            # Sort by timestamp
            failed_tests.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            return {
                "total_failed": len(failed_tests),
                "failed_tests": failed_tests[:limit],
                "generated_at": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get failed tests report: {e}")
            return {"total_failed": 0, "failed_tests": []}
    
    async def export_report_to_file(self, report_data: Dict[str, Any], format: str = "json") -> Dict[str, Any]:
        """Export report to file"""
        import json
        import os
        from config.settings import settings
        
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"report_{timestamp}.{format}"
            filepath = os.path.join(settings.REPORT_PATH, filename)
            
            os.makedirs(settings.REPORT_PATH, exist_ok=True)
            
            if format == "json":
                with open(filepath, 'w') as f:
                    json.dump(report_data, f, indent=2)
            elif format == "txt":
                with open(filepath, 'w') as f:
                    f.write(str(report_data))
            
            return {
                "filename": filename,
                "filepath": filepath,
                "size": os.path.getsize(filepath),
                "message": f"Report exported as {format}"
            }
            
        except Exception as e:
            logger.error(f"Failed to export report: {e}")
            raise HTTPException(status_code=500, detail=str(e))

report_controller = ReportController()