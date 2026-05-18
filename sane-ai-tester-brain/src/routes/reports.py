from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from datetime import datetime
from services.reportService import report_service
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

@router.get("/reports/test-summary")
async def get_test_summary_report(
    project_name: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
) -> Dict[str, Any]:
    """Get test summary report"""
    try:
        report = await report_service.generate_summary_report(
            project_name=project_name,
            start_date=start_date,
            end_date=end_date
        )
        return report
    except Exception as e:
        logger.error(f"Failed to generate report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/failed-tests")
async def get_failed_tests_report(limit: int = 50) -> List[Dict[str, Any]]:
    """Get failed tests report"""
    try:
        failed_tests = await report_service.get_failed_tests(limit)
        return failed_tests
    except Exception as e:
        logger.error(f"Failed to get failed tests: {e}")
        return []

@router.post("/reports/export")
async def export_report(report_data: Dict[str, Any]) -> Dict[str, Any]:
    """Export report to file"""
    try:
        file_path = await report_service.export_report(report_data)
        return {"file_path": file_path, "message": "Report exported successfully"}
    except Exception as e:
        logger.error(f"Failed to export report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reports/task/{task_id}")
async def get_report_by_task(task_id: str) -> Dict[str, Any]:
    """Get report by task ID from Node.js API"""
    try:
        from services.apiBridgeService import api_bridge_service
        report = await api_bridge_service.get_report_by_task(task_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found for this task")
        return report
    except Exception as e:
        logger.error(f"Failed to get report for task {task_id}: {e}")
        raise HTTPException(status_code=404, detail=str(e))