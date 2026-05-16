from typing import Dict, Any, List
from fastapi import HTTPException
from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger

logger = get_logger(__name__)

class TaskController:
    """Controller for task management using exhaustive API Bridge"""
    
    async def get_all_tasks(self) -> List[Dict[str, Any]]:
        try:
            return await api_bridge_service.get_all_tasks()
        except Exception as e:
            logger.error(f"Failed to get tasks: {e}")
            return []

    async def create_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            return await api_bridge_service.create_task(task_data)
        except Exception as e:
            logger.error(f"Failed to create task: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    async def get_task_status(self, task_id: str) -> Dict[str, Any]:
        try:
            return await api_bridge_service.get_task_by_id(task_id)
        except Exception as e:
            logger.error(f"Failed to get task status {task_id}: {e}")
            raise HTTPException(status_code=404, detail="Task not found")

    async def retry_task(self, task_id: str) -> Dict[str, Any]:
        try:
            return await api_bridge_service.retry_task(task_id)
        except Exception as e:
            logger.error(f"Failed to retry task {task_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

task_controller = TaskController()