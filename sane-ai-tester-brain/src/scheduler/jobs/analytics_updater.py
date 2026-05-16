from services.analyticsService import analytics_service
from utils.logger import get_logger

logger = get_logger(__name__)

async def update_analytics():
    """Update analytics data"""
    logger.info("📊 Updating analytics data...")
    
    try:
        await analytics_service.update_metrics()
        logger.info("✅ Analytics updated successfully")
    except Exception as e:
        logger.error(f"Analytics update failed: {e}")