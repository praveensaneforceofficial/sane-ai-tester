from services.apiBridgeService import api_bridge_service
from services.taskService import task_service
from utils.logger import get_logger

logger = get_logger(__name__)

async def retry_failed_tasks():
    """Retry failed tasks"""
    logger.info("🔄 Checking for failed tasks to retry...")
    
    try:
        workers = await api_bridge_service.get_workers()
        
        for worker in workers:
            tasks = await api_bridge_service.get_worker_tasks(worker['worker_id'], limit=20)
            failed_tasks = [t for t in tasks if t.get('status') == 'failed']
            
            for task in failed_tasks:
                logger.info(f"Retrying task {task.get('id')} on {worker['worker_id']}")
                
                # Get original task data
                task_data = task.get('result_data', {})
                
                # Resend task
                await api_bridge_service.send_task(
                    worker_id=worker['worker_id'],
                    url=task_data.get('url', ''),
                    prompt=task_data.get('prompt', 'Retry: ') + task.get('prompt', '')
                )
                
    except Exception as e:
        logger.error(f"Task retrier failed: {e}")