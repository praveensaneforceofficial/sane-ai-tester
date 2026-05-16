from typing import Dict, Any, List
from datetime import datetime, timedelta
from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger

logger = get_logger(__name__)

class AnalyticsService:
    """Service for analytics and metrics"""
    
    def __init__(self):
        self.cache = {}
    
    async def get_task_stats(self) -> Dict[str, Any]:
        """Get task statistics"""
        try:
            workers = await api_bridge_service.get_workers()
            
            total = 0
            completed = 0
            failed = 0
            
            for worker in workers:
                tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'], limit=200)
                total += len(tasks)
                completed += len([t for t in tasks if t.get('status') == 'completed'])
                failed += len([t for t in tasks if t.get('status') == 'failed'])
            
            pending = total - completed - failed
            success_rate = round((completed / total * 100) if total > 0 else 0, 2)
            
            return {
                "total": total,
                "completed": completed,
                "failed": failed,
                "pending": pending,
                "success_rate": success_rate
            }
        except Exception as e:
            logger.error(f"Failed to get task stats: {e}")
            return {"total": 0, "completed": 0, "failed": 0, "pending": 0, "success_rate": 0}
    
    async def get_token_usage(self, days: int = 7) -> Dict[str, Any]:
        """Get token usage analytics"""
        # This would get actual token usage from API or database
        # For now, return mock data
        return {
            "used": 7200,
            "remaining": 2800,
            "total": 10000,
            "daily": [1200, 800, 1500, 900, 1100, 700, 1000][:days]
        }
    
    async def update_metrics(self):
        """Update metrics cache"""
        try:
            self.cache['task_stats'] = await self.get_task_stats()
            self.cache['updated_at'] = datetime.now().isoformat()
            logger.info("Metrics cache updated")
        except Exception as e:
            logger.error(f"Failed to update metrics: {e}")
    
    async def get_daily_metrics(self, days: int = 7) -> List[Dict[str, Any]]:
        """Get daily metrics for charts"""
        metrics = []
        workers = await api_bridge_service.get_workers()
        
        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            
            daily_tasks = 0
            for worker in workers:
                tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'], limit=300)
                daily_tasks += len([t for t in tasks if t.get('created_at', '')[:10] == date])
            
            metrics.append({
                "date": date,
                "tasks": daily_tasks
            })
        
        return metrics

analytics_service = AnalyticsService()