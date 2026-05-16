from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from services.apiBridgeService import api_bridge_service
from services.analyticsService import analytics_service
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

@router.get("/dashboard/stats")
async def get_dashboard_stats() -> Dict[str, Any]:
    """Get aggregated dashboard statistics"""
    try:
        workers = await api_bridge_service.get_workers()
        
        online_workers = [w for w in workers if w.get('status') == 'online']
        offline_workers = [w for w in workers if w.get('status') != 'online']
        
        # Get task stats from analytics
        task_stats = await analytics_service.get_task_stats()
        
        return {
            "total_workers": len(workers),
            "online_workers": len(online_workers),
            "offline_workers": len(offline_workers),
            "total_tasks": task_stats.get('total', 0),
            "completed_tasks": task_stats.get('completed', 0),
            "failed_tasks": task_stats.get('failed', 0),
            "pending_tasks": task_stats.get('pending', 0)
        }
    except Exception as e:
        logger.error(f"Failed to get dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/recent-activities")
async def get_recent_activities(limit: int = 10):
    """Get recent activities"""
    try:
        workers = await api_bridge_service.get_workers()
        
        activities = []
        for worker in workers[:limit]:
            tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'], limit=3)
            for task in tasks:
                activities.append({
                    "worker": worker['nickname'],
                    "task_id": task.get('id'),
                    "status": task.get('status'),
                    "timestamp": task.get('created_at')
                })
        
        # Sort by timestamp
        activities.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return activities[:limit]
    except Exception as e:
        logger.error(f"Failed to get recent activities: {e}")
        return []