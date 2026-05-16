from typing import List, Dict, Any, Optional
from connectors.api_bridge.rest_client import api_rest_client
from connectors.api_bridge.websocket_client import api_ws_client
from connectors.api_bridge.event_handlers import event_handlers
from utils.logger import get_logger

logger = get_logger(__name__)

class APIBridgeService:
    """Service for communicating with API Bridge"""
    
    def __init__(self):
        self.is_ready = False
    
    async def initialize(self):
        """Initialize connection to API Bridge"""
        # Setup WebSocket event handler
        api_ws_client.set_event_callback(event_handlers.handle_event)
        
        # Connect WebSocket
        await api_ws_client.connect()
        
        self.is_ready = True
        logger.info("API Bridge Service initialized")
    
    async def get_workers(self) -> List[Dict]:
        """Get all workers from API Bridge"""
        try:
            return await api_rest_client.get("/api/workers")
        except Exception as e:
            logger.error(f"Failed to get workers: {e}")
            return []
    
    async def get_worker_tasks(self, worker_id: str, limit: int = 10) -> List[Dict]:
        """Get tasks for specific worker"""
        try:
            tasks = await api_rest_client.get(f"/api/tasks/{worker_id}")
            return tasks[:limit] if tasks else []
        except Exception as e:
            logger.error(f"Failed to get tasks for {worker_id}: {e}")
            return []
    
    async def send_task(self, worker_id: str, url: str, prompt: str) -> Dict:
        """Send task to worker via WebSocket"""
        try:
            await api_ws_client.send_task(worker_id, url, prompt)
            return {"status": "sent", "worker_id": worker_id, "url": url}
        except Exception as e:
            logger.error(f"Failed to send task to {worker_id}: {e}")
            raise
    
    async def get_task_result(self, task_id: int) -> Optional[Dict]:
        """Get task result from API Bridge"""
        # This would need a specific endpoint
        # For now, return None
        return None
    
    async def close(self):
        """Close connections"""
        await api_ws_client.disconnect()
        await api_rest_client.close()

# Singleton instance
api_bridge_service = APIBridgeService()