from typing import Dict, Any, List
from fastapi import HTTPException
from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger

logger = get_logger(__name__)

class WorkerController:
    """Controller for worker management"""
    
    async def get_all_workers(self) -> List[Dict[str, Any]]:
        """Get all workers"""
        try:
            return await api_bridge_service.get_workers()
        except Exception as e:
            logger.error(f"Failed to get workers: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def get_worker(self, worker_id: str) -> Dict[str, Any]:
        """Get specific worker"""
        try:
            workers = await api_bridge_service.get_workers()
            for worker in workers:
                if worker.get('worker_id') == worker_id:
                    return worker
            raise HTTPException(status_code=404, detail="Worker not found")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get worker {worker_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    async def get_worker_tasks(self, worker_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get tasks for specific worker"""
        try:
            return await api_bridge_service.get_worker_tasks(worker_id, limit)
        except Exception as e:
            logger.error(f"Failed to get tasks for worker {worker_id}: {e}")
            return []
    
    async def get_online_workers(self) -> List[Dict[str, Any]]:
        """Get only online workers"""
        try:
            workers = await api_bridge_service.get_workers()
            return [w for w in workers if w.get('status') == 'online']
        except Exception as e:
            logger.error(f"Failed to get online workers: {e}")
            return []

worker_controller = WorkerController()