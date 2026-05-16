import os
import shutil
from datetime import datetime, timedelta
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

async def clean_old_reports():
    """Clean reports older than 30 days"""
    logger.info("🧹 Cleaning old reports...")
    
    try:
        cutoff_date = datetime.now() - timedelta(days=30)
        
        # Clean reports directory
        if os.path.exists(settings.REPORT_PATH):
            for filename in os.listdir(settings.REPORT_PATH):
                file_path = os.path.join(settings.REPORT_PATH, filename)
                if os.path.isfile(file_path):
                    file_mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
                    if file_mtime < cutoff_date:
                        os.remove(file_path)
                        logger.debug(f"Removed old report: {filename}")
        
        # Clean screenshots directory
        if os.path.exists(settings.SCREENSHOT_PATH):
            for filename in os.listdir(settings.SCREENSHOT_PATH):
                file_path = os.path.join(settings.SCREENSHOT_PATH, filename)
                if os.path.isfile(file_path):
                    file_mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
                    if file_mtime < cutoff_date:
                        os.remove(file_path)
                        logger.debug(f"Removed old screenshot: {filename}")
        
        logger.info("✅ Report cleanup completed")
        
    except Exception as e:
        logger.error(f"Report cleanup failed: {e}")