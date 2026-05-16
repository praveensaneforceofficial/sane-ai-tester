from typing import Dict, Any, List
from fastapi import HTTPException
from services.apiBridgeService import api_bridge_service
from services.analyticsService import analytics_service
from utils.logger import get_logger

logger = get_logger(__name__)

class DashboardController:
    """Controller for dashboard data aggregation"""
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get dashboard statistics"""
        try:
            workers = await api_bridge_service.get_workers()
            
            online_workers = [w for w in workers if w.get('status') == 'online']
            offline_workers = [w for w in workers if w.get('status') != 'online']
            
            # Get task stats
            task_stats = await analytics_service.get_task_stats()
            
            return {
                "total_workers": len(workers),
                "online_workers": len(online_workers),
                "offline_workers": len(offline_workers),
                "total_tasks": task_stats.get('total', 0),
                "completed_tasks": task_stats.get('completed', 0),
                "failed_tasks": task_stats.get('failed', 0),
                "pending_tasks": task_stats.get('pending', 0),
                "success_rate": task_stats.get('success_rate', 0)
            }
        except Exception as e:
            logger.error(f"Failed to get dashboard stats: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def get_activity_feed(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get recent activity feed"""
        try:
            activities = []
            workers = await api_bridge_service.get_workers()
            
            for worker in workers[:10]:
                tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'], limit=5)
                for task in tasks:
                    activities.append({
                        "id": task.get('id'),
                        "type": "task",
                        "worker": worker.get('nickname'),
                        "worker_id": worker.get('worker_id'),
                        "status": task.get('status'),
                        "timestamp": task.get('created_at'),
                        "message": f"Task {task.get('id')} {task.get('status')} on {worker.get('nickname')}"
                    })
            
            # Sort by timestamp and limit
            activities.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            return activities[:limit]
            
        except Exception as e:
            logger.error(f"Failed to get activity feed: {e}")
            return []
    
    async def get_worker_summary(self) -> List[Dict[str, Any]]:
        """Get worker summary for dashboard"""
        try:
            workers = await api_bridge_service.get_workers()
            summary = []
            
            for worker in workers:
                tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'], limit=50)
                
                total = len(tasks)
                completed = len([t for t in tasks if t.get('status') == 'completed'])
                failed = len([t for t in tasks if t.get('status') == 'failed'])
                
                summary.append({
                    "worker_id": worker.get('worker_id'),
                    "nickname": worker.get('nickname'),
                    "status": worker.get('status'),
                    "last_seen": worker.get('last_seen'),
                    "total_tasks": total,
                    "completed_tasks": completed,
                    "failed_tasks": failed,
                    "success_rate": round((completed / total * 100) if total > 0 else 0, 2)
                })
            
            return summary
            
        except Exception as e:
            logger.error(f"Failed to get worker summary: {e}")
            return []

dashboard_controller = DashboardController()