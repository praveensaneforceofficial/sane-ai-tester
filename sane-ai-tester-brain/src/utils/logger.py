from loguru import logger
import sys
from config.settings import settings

# Remove default handler
logger.remove()

# Add console handler
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL,
    colorize=True
)

# Add file handler
logger.add(
    settings.LOG_FILE,
    rotation=settings.LOG_MAX_SIZE,
    retention=f"{settings.LOG_BACKUP_COUNT} days",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level=settings.LOG_LEVEL,
    compression="zip"
)

def get_logger(name: str):
    """Get logger with specific name"""
    return logger.bind(name=name)