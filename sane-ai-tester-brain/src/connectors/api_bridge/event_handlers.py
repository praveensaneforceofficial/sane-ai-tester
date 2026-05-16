from typing import Dict, Any
from utils.logger import get_logger

logger = get_logger(__name__)

class APIEventHandlers:
    """Handle standardized events from API Bridge"""
    
    def __init__(self):
        self.handlers = {
            "dashboard:update": self.handle_dashboard_update,
            "worker:online": self.handle_worker_online,
            "worker:offline": self.handle_worker_offline,
            "report:generated": self.handle_report_generated
        }
    
    async def handle_event(self, event: str, data: Dict[str, Any]):
        """Route event to appropriate handler"""
        handler = self.handlers.get(event)
        if handler:
            await handler(data)
        else:
            logger.debug(f"Event {event} received but no specialized handler defined in brain.")
    
    async def handle_dashboard_update(self, data: Dict):
        """Handle global dashboard refresh event"""
        logger.info("📡 Dashboard update event received")
        # Logic to notify connected dashboard clients if using WebSockets for frontend
    
    async def handle_worker_online(self, data: Dict):
        """Handle worker coming online"""
        worker_id = data.get('workerId')
        nickname = data.get('nickname')
        logger.info(f"🟢 Worker online: {nickname} ({worker_id})")
    
    async def handle_worker_offline(self, data: Dict):
        """Handle worker going offline"""
        worker_id = data.get('workerId')
        logger.info(f"🔴 Worker offline: {worker_id}")
    
    async def handle_report_generated(self, data: Dict):
        """Handle report generation completion"""
        task_id = data.get('taskId')
        logger.info(f"📄 Report ready for task: {task_id}")

# Singleton instance
event_handlers = APIEventHandlers()