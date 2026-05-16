from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger
import asyncio

logger = get_logger(__name__)

def check_worker_health():
    """Trigger worker health refresh on API server"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(api_bridge_service.get_health())
        loop.close()
    except Exception as e:
        logger.error(f"Error in worker health job: {e}")