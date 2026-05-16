from typing import Dict, Any, List, Optional
from fastapi import HTTPException
from services.taskService import task_service
from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger
from utils.validators import validate_url, validate_worker_id

logger = get_logger(__name__)

class TaskController:
    """Controller for task management"""
    
    async def create_task(self, worker_id: str, url: str, prompt: Optional[str] = None) -> Dict[str, Any]:
        """Create and send task to worker"""
        # Validate inputs
        if not validate_worker_id(worker_id):
            raise HTTPException(status_code=400, detail="Invalid worker ID format")
        
        if not validate_url(url):
            raise HTTPException(status_code=400, detail="Invalid URL format")
        
        try:
            result = await task_service.send_task(worker_id, url, prompt)
            return {
                "status": "success",
                "worker_id": worker_id,
                "url": url,
                "message": "Task sent successfully",
                "data": result
            }
        except Exception as e:
            logger.error(f"Failed to create task: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def get_task_history(self, worker_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get task history for worker"""
        try:
            return await api_bridge_service.get_worker_tasks(worker_id, limit)
        except Exception as e:
            logger.error(f"Failed to get task history: {e}")
            return []
    
    async def get_task_status(self, task_id: int) -> Dict[str, Any]:
        """Get specific task status"""
        try:
            # This would need a specific endpoint in API bridge
            # For now, search through workers
            workers = await api_bridge_service.get_workers()
            for worker in workers:
                tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'])
                for task in tasks:
                    if task.get('id') == task_id:
                        return {
                            "task_id": task_id,
                            "status": task.get('status'),
                            "worker": worker.get('nickname'),
                            "result": task.get('result_data')
                        }
            raise HTTPException(status_code=404, detail="Task not found")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get task status: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def retry_task(self, task_id: int) -> Dict[str, Any]:
        """Retry a failed task"""
        try:
            # Find the task
            workers = await api_bridge_service.get_workers()
            for worker in workers:
                tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'])
                for task in tasks:
                    if task.get('id') == task_id and task.get('status') == 'failed':
                        # Resend task
                        task_data = task.get('result_data', {})
                        result = await task_service.send_task(
                            worker['worker_id'],
                            task_data.get('url', ''),
                            f"Retry: {task.get('prompt', '')}"
                        )
                        return {
                            "status": "retried",
                            "task_id": task_id,
                            "new_task": result
                        }
            
            raise HTTPException(status_code=404, detail="Failed task not found")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to retry task: {e}")
            raise HTTPException(status_code=500, detail=str(e))

task_controller = TaskController()