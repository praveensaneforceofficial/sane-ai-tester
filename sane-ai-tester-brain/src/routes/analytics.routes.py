from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime, timedelta
from services.analyticsService import analytics_service
from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

@router.get("/analytics/token-usage")
async def get_token_usage(days: int = 7) -> Dict[str, Any]:
    """Get token usage analytics"""
    try:
        usage = await analytics_service.get_token_usage(days)
        return usage
    except Exception as e:
        logger.error(f"Failed to get token usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics/worker-performance")
async def get_worker_performance() -> List[Dict[str, Any]]:
    """Get worker performance metrics"""
    try:
        workers = await api_bridge_service.get_workers()
        
        performance = []
        for worker in workers:
            tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'], limit=50)
            
            total = len(tasks)
            completed = len([t for t in tasks if t.get('status') == 'completed'])
            failed = len([t for t in tasks if t.get('status') == 'failed'])
            
            performance.append({
                "worker_id": worker['worker_id'],
                "nickname": worker['nickname'],
                "total_tasks": total,
                "completed_tasks": completed,
                "failed_tasks": failed,
                "success_rate": round((completed / total * 100) if total > 0 else 0, 2),
                "status": worker.get('status')
            })
        
        return performance
    except Exception as e:
        logger.error(f"Failed to get worker performance: {e}")
        return []

@router.get("/analytics/daily-metrics")
async def get_daily_metrics(days: int = 7) -> List[Dict[str, Any]]:
    """Get daily metrics for charts"""
    try:
        metrics = await analytics_service.get_daily_metrics(days)
        return metrics
    except Exception as e:
        logger.error(f"Failed to get daily metrics: {e}")
        return []