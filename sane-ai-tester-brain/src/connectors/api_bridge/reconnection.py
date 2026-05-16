import asyncio
from typing import Optional, Callable
from utils.logger import get_logger

logger = get_logger(__name__)

class ReconnectionManager:
    """Manage reconnection for WebSocket and HTTP clients"""
    
    def __init__(self):
        self.max_retries = 5
        self.base_delay = 1
        self.max_delay = 30
        self.is_reconnecting = False
        self.reconnect_callbacks: list[Callable] = []
    
    async def reconnect_with_backoff(self, connect_func: Callable) -> bool:
        """Reconnect with exponential backoff"""
        if self.is_reconnecting:
            logger.warning("Already reconnecting, skipping...")
            return False
        
        self.is_reconnecting = True
        
        for attempt in range(self.max_retries):
            try:
                delay = min(self.base_delay * (2 ** attempt), self.max_delay)
                logger.info(f"Reconnection attempt {attempt + 1}/{self.max_retries} in {delay}s")
                
                await asyncio.sleep(delay)
                
                result = await connect_func()
                if result:
                    logger.info("✅ Reconnection successful")
                    self.is_reconnecting = False
                    await self._notify_callbacks(True)
                    return True
                    
            except Exception as e:
                logger.error(f"Reconnection attempt {attempt + 1} failed: {e}")
        
        self.is_reconnecting = False
        await self._notify_callbacks(False)
        logger.error("❌ All reconnection attempts failed")
        return False
    
    def add_reconnect_callback(self, callback: Callable):
        """Add callback for reconnection events"""
        self.reconnect_callbacks.append(callback)
    
    async def _notify_callbacks(self, success: bool):
        """Notify all callbacks about reconnection result"""
        for callback in self.reconnect_callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(success)
                else:
                    callback(success)
            except Exception as e:
                logger.error(f"Callback error: {e}")

# Singleton instance
reconnection_manager = ReconnectionManager()