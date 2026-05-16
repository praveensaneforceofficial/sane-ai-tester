from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger

logger = get_logger(__name__)

class DashboardController:
    """Controller for aggregating dashboard data"""
    
    async def get_metrics(self):
        """Get high-level KPI metrics"""
        try:
            return await api_bridge_service.get_dashboard_metrics()
        except Exception as e:
            logger.error(f"Dashboard metrics error: {e}")
            return {}

    async def get_worker_status(self):
        """Get summary of worker status"""
        try:
            return await api_bridge_service.get_workers()
        except Exception as e:
            logger.error(f"Worker status error: {e}")
            return []

    async def get_recent_tasks(self, limit: int = 5):
        """Get most recent tasks"""
        try:
            tasks = await api_bridge_service.get_tasks()
            return sorted(tasks, key=lambda x: x.get('created_at', ''), reverse=True)[:limit]
        except Exception as e:
            logger.error(f"Recent tasks error: {e}")
            return []

# Singleton instance
dashboard_controller = DashboardController()