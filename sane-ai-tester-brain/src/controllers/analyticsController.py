from typing import Dict, Any, List
from datetime import datetime, timedelta
from fastapi import HTTPException
from services.analyticsService import analytics_service
from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger

logger = get_logger(__name__)

class AnalyticsController:
    """Controller for analytics and metrics"""
    
    async def get_dashboard_metrics(self) -> Dict[str, Any]:
        """Get all dashboard metrics"""
        try:
            workers = await api_bridge_service.get_workers()
            
            # Worker metrics
            total_workers = len(workers)
            online_workers = len([w for w in workers if w.get('status') == 'online'])
            
            # Task metrics
            all_tasks = []
            for worker in workers:
                tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'], limit=100)
                all_tasks.extend(tasks)
            
            total_tasks = len(all_tasks)
            completed_tasks = len([t for t in all_tasks if t.get('status') == 'completed'])
            failed_tasks = len([t for t in all_tasks if t.get('status') == 'failed'])
            
            # Calculate success rate
            success_rate = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2)
            
            # Get token usage
            token_usage = await analytics_service.get_token_usage(7)
            
            return {
                "workers": {
                    "total": total_workers,
                    "online": online_workers,
                    "offline": total_workers - online_workers
                },
                "tasks": {
                    "total": total_tasks,
                    "completed": completed_tasks,
                    "failed": failed_tasks,
                    "pending": total_tasks - completed_tasks - failed_tasks,
                    "success_rate": success_rate
                },
                "tokens": token_usage,
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to get dashboard metrics: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def get_worker_performance(self) -> List[Dict[str, Any]]:
        """Get performance metrics per worker"""
        try:
            workers = await api_bridge_service.get_workers()
            performance = []
            
            for worker in workers:
                tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'], limit=100)
                
                total = len(tasks)
                completed = len([t for t in tasks if t.get('status') == 'completed'])
                failed = len([t for t in tasks if t.get('status') == 'failed'])
                
                # Calculate average execution time
                durations = [t.get('duration', 0) for t in tasks if t.get('duration')]
                avg_duration = sum(durations) / len(durations) if durations else 0
                
                performance.append({
                    "worker_id": worker.get('worker_id'),
                    "nickname": worker.get('nickname'),
                    "status": worker.get('status'),
                    "total_tasks": total,
                    "completed": completed,
                    "failed": failed,
                    "success_rate": round((completed / total * 100) if total > 0 else 0, 2),
                    "avg_duration": round(avg_duration, 2),
                    "last_seen": worker.get('last_seen')
                })
            
            # Sort by success rate
            performance.sort(key=lambda x: x['success_rate'], reverse=True)
            return performance
            
        except Exception as e:
            logger.error(f"Failed to get worker performance: {e}")
            return []
    
    async def get_daily_trends(self, days: int = 7) -> List[Dict[str, Any]]:
        """Get daily trends for charts"""
        try:
            trends = []
            workers = await api_bridge_service.get_workers()
            
            for i in range(days):
                date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
                
                daily_completed = 0
                daily_failed = 0
                
                for worker in workers:
                    tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'], limit=200)
                    for task in tasks:
                        created_date = task.get('created_at', '')[:10]
                        if created_date == date:
                            if task.get('status') == 'completed':
                                daily_completed += 1
                            elif task.get('status') == 'failed':
                                daily_failed += 1
                
                trends.append({
                    "date": date,
                    "completed": daily_completed,
                    "failed": daily_failed,
                    "total": daily_completed + daily_failed
                })
            
            return trends
            
        except Exception as e:
            logger.error(f"Failed to get daily trends: {e}")
            return []

analytics_controller = AnalyticsController()