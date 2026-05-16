from services.zohoService import zoho_service
from utils.logger import get_logger
import asyncio

logger = get_logger(__name__)

def poll_zoho_sprint():
    """Wrapper for async sync_all method"""
    try:
        # Since APScheduler runs in its own thread, we need to create a new event loop for async calls
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(zoho_service.sync_all())
        loop.close()
    except Exception as e:
        logger.error(f"Error in Zoho poller job: {e}")