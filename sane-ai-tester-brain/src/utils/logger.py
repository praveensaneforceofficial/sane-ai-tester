import logging
import sys
import os
from logging.handlers import RotatingFileHandler
from config.settings import settings

def get_logger(name):
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        logger.setLevel(settings.LOG_LEVEL)
        
        # Formatter
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Console Handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
        # File Handler
        if settings.LOG_FILE:
            os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)
            file_handler = RotatingFileHandler(
                settings.LOG_FILE, 
                maxBytes=settings.LOG_MAX_SIZE, 
                backupCount=settings.LOG_BACKUP_COUNT
            )
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
            
    return logger