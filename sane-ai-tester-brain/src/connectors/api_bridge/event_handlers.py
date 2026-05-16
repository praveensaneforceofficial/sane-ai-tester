from typing import Dict, Any
from utils.logger import get_logger
from services.taskService import task_service
from services.analyticsService import analytics_service

logger = get_logger(__name__)

class APIEventHandlers:
    """Handle events from API Bridge"""
    
    def __init__(self):
        self.handlers = {
            "update_brain": self.handle_update_brain,
            "task_completed": self.handle_task_completed,
            "worker_status_change": self.handle_worker_status_change
        }
    
    async def handle_event(self, event: str, data: Dict[str, Any]):
        """Route event to appropriate handler"""
        handler = self.handlers.get(event)
        if handler:
            await handler(data)
        else:
            logger.warning(f"No handler for event: {event}")
    
    async def handle_update_brain(self, data: Dict):
        """Handle brain update event"""
        logger.info("Brain update requested, refreshing data")
        # This will trigger dashboard refresh
        from services.monitorService import monitor_service
        await monitor_service.refresh_all_data()
    
    async def handle_task_completed(self, data: Dict):
        """Handle task completion event"""
        task_id = data.get('taskId')
        worker_id = data.get('workerId')
        status = data.get('status')
        
        logger.info(f"Task {task_id} completed by {worker_id} with status {status}")
        
        # Update analytics
        await analytics_service.update_task_metrics(task_id, status)
        
        # Generate report if needed
        if status == 'completed':
            from services.reportService import report_service
            await report_service.generate_test_report(task_id)
    
    async def handle_worker_status_change(self, data: Dict):
        """Handle worker status change event"""
        worker_id = data.get('workerId')
        old_status = data.get('oldStatus')
        new_status = data.get('newStatus')
        
        logger.info(f"Worker {worker_id} status changed: {old_status} → {new_status}")
        
        # Update worker tracking
        from services.workerService import worker_service
        await worker_service.update_worker_status(worker_id, new_status)

# Singleton instance
event_handlers = APIEventHandlers()