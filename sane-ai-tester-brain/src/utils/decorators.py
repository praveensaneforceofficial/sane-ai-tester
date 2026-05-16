import asyncio
import functools
from typing import Callable, Any
from datetime import datetime
from utils.logger import get_logger

logger = get_logger(__name__)

def log_execution(func: Callable) -> Callable:
    """Log function execution time"""
    @functools.wraps(func)
    async def async_wrapper(*args, **kwargs):
        start = datetime.now()
        try:
            result = await func(*args, **kwargs)
            duration = (datetime.now() - start).total_seconds()
            logger.debug(f"{func.__name__} completed in {duration:.2f}s")
            return result
        except Exception as e:
            duration = (datetime.now() - start).total_seconds()
            logger.error(f"{func.__name__} failed after {duration:.2f}s: {e}")
            raise
    
    @functools.wraps(func)
    def sync_wrapper(*args, **kwargs):
        start = datetime.now()
        try:
            result = func(*args, **kwargs)
            duration = (datetime.now() - start).total_seconds()
            logger.debug(f"{func.__name__} completed in {duration:.2f}s")
            return result
        except Exception as e:
            duration = (datetime.now() - start).total_seconds()
            logger.error(f"{func.__name__} failed after {duration:.2f}s: {e}")
            raise
    
    return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

def retry_on_failure(max_retries: int = 3, delay: float = 1.0):
    """Retry function on failure"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            last_error = None
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        logger.warning(f"Retry {attempt + 1}/{max_retries} for {func.__name__}: {e}")
                        await asyncio.sleep(delay * (attempt + 1))
            logger.error(f"All {max_retries} retries failed for {func.__name__}")
            raise last_error
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            last_error = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_error = e
                    if attempt < max_retries - 1:
                        logger.warning(f"Retry {attempt + 1}/{max_retries} for {func.__name__}: {e}")
                        import time
                        time.sleep(delay * (attempt + 1))
            logger.error(f"All {max_retries} retries failed for {func.__name__}")
            raise last_error
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator

def timed_cache(ttl: int = 60):
    """Cache function results with TTL"""
    def decorator(func: Callable) -> Callable:
        cache = {}
        
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            key = str(args) + str(kwargs)
            now = datetime.now()
            
            if key in cache:
                result, timestamp = cache[key]
                if (now - timestamp).total_seconds() < ttl:
                    return result
            
            result = await func(*args, **kwargs)
            cache[key] = (result, now)
            return result
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            key = str(args) + str(kwargs)
            now = datetime.now()
            
            if key in cache:
                result, timestamp = cache[key]
                if (now - timestamp).total_seconds() < ttl:
                    return result
            
            result = func(*args, **kwargs)
            cache[key] = (result, now)
            return result
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator