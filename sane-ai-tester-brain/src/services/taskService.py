from typing import Dict, Optional
from services.apiBridgeService import api_bridge_service
from services.aiOrchestratorService import ai_orchestrator
from utils.logger import get_logger

logger = get_logger(__name__)

class TaskService:
    """Service for managing tasks"""
    
    async def send_task(self, worker_id: str, url: str, prompt: Optional[str] = None) -> Dict:
        """Send task to worker"""
        # If no prompt provided, generate using AI
        if not prompt:
            prompt = await ai_orchestrator.generate_test_prompt(url)
        
        # Send via API bridge
        result = await api_bridge_service.send_task(worker_id, url, prompt)
        
        logger.info(f"Task sent to {worker_id} for {url}")
        return result
    
    async def retry_failed_tasks(self):
        """Retry failed tasks"""
        # Get failed tasks from database via API bridge
        workers = await api_bridge_service.get_workers()
        
        for worker in workers:
            tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'])
            failed_tasks = [t for t in tasks if t.get('status') == 'failed']
            
            for task in failed_tasks:
                logger.info(f"Retrying task {task.get('id')} on {worker['worker_id']}")
                # Implement retry logic
                pass

# Singleton instance
task_service = TaskService()