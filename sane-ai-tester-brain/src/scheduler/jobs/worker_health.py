from services.apiBridgeService import api_bridge_service
from services.monitorService import monitor_service
from utils.logger import get_logger

logger = get_logger(__name__)

async def check_worker_health():
    """Check health of all workers"""
    logger.info("🏥 Checking worker health...")
    
    try:
        workers = await api_bridge_service.get_workers()
        
        for worker in workers:
            worker_id = worker.get('worker_id')
            status = worker.get('status')
            last_seen = worker.get('last_seen')
            
            # Log worker status
            logger.debug(f"Worker {worker_id}: {status} (last seen: {last_seen})")
            
            # Track metrics
            await monitor_service.track_worker_health(worker_id, status, last_seen)
            
    except Exception as e:
        logger.error(f"Worker health check failed: {e}")