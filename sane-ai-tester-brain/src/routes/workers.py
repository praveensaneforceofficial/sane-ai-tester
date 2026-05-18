from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from controllers.workerController import worker_controller
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

@router.get("/workers")
async def get_all_workers() -> List[Dict[str, Any]]:
    """Get all workers"""
    return await worker_controller.get_all_workers()

@router.get("/workers/online")
async def get_online_workers() -> List[Dict[str, Any]]:
    """Get only online workers"""
    return await worker_controller.get_online_workers()

@router.get("/workers/{worker_id}")
async def get_worker(worker_id: str) -> Dict[str, Any]:
    """Get specific worker"""
    return await worker_controller.get_worker(worker_id)

@router.get("/workers/{worker_id}/tasks")
async def get_worker_tasks(
    worker_id: str,
    limit: int = Query(50, ge=1, le=200)
) -> List[Dict[str, Any]]:
    """Get tasks for specific worker"""
    return await worker_controller.get_worker_tasks(worker_id, limit)

@router.put("/workers/{worker_id}/status")
async def update_worker_status(worker_id: str, status_data: Dict[str, Any]) -> Dict[str, Any]:
    """Update worker status/action"""
    action = status_data.get("action")
    if not action:
        raise HTTPException(status_code=400, detail="Action is required")
    return await worker_controller.update_worker_status(worker_id, action)

@router.delete("/workers/{worker_id}")
async def delete_worker(worker_id: str) -> Dict[str, Any]:
    """Delete/Remove worker"""
    return await worker_controller.delete_worker(worker_id)