from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from controllers.taskController import task_controller
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

class TaskCreateRequest(BaseModel):
    worker_id: str
    url: str
    prompt: Optional[str] = None

@router.post("/tasks/send")
async def send_task(request: TaskCreateRequest) -> Dict[str, Any]:
    """Send task to worker"""
    return await task_controller.create_task(
        worker_id=request.worker_id,
        url=request.url,
        prompt=request.prompt
    )

@router.get("/tasks/history/{worker_id}")
async def get_task_history(
    worker_id: str,
    limit: int = Query(50, ge=1, le=200)
) -> List[Dict[str, Any]]:
    """Get task history for worker"""
    return await task_controller.get_task_history(worker_id, limit)

@router.get("/tasks/status/{task_id}")
async def get_task_status(task_id: int) -> Dict[str, Any]:
    """Get specific task status"""
    return await task_controller.get_task_status(task_id)

@router.post("/tasks/retry/{task_id}")
async def retry_task(task_id: int) -> Dict[str, Any]:
    """Retry a failed task"""
    return await task_controller.retry_task(task_id)