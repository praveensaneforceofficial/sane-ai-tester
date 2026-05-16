import socketio
from typing import Optional, Dict, Any
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class APIWebSocketClient:
    """WebSocket client for real-time API Bridge communication"""
    
    def __init__(self):
        self.sio = socketio.AsyncClient()
        self.is_connected = False
        self._setup_handlers()
    
    def _setup_handlers(self):
        """Setup WebSocket event handlers"""
        
        @self.sio.event
        async def connect():
            logger.info("✅ Connected to API Bridge WebSocket")
            self.is_connected = True
        
        @self.sio.event
        async def disconnect():
            logger.warning("⚠️ Disconnected from API Bridge WebSocket")
            self.is_connected = False
        
        @self.sio.event
        async def update_brain(data):
            logger.info(f"📡 Received update-brain event: {data}")
            # This will be handled by event handlers
            await self._handle_event("update_brain", data)
        
        @self.sio.event
        async def task_completed_alert(data):
            logger.info(f"📥 Task completed: {data.get('taskId')}")
            await self._handle_event("task_completed", data)
    
    async def _handle_event(self, event: str, data: Dict):
        """Handle incoming events"""
        # This will be overridden by the main brain
        if hasattr(self, 'event_callback'):
            await self.event_callback(event, data)
    
    async def connect(self):
        """Connect to API Bridge WebSocket"""
        try:
            await self.sio.connect(settings.API_WS_URL)
            logger.info(f"Connecting to {settings.API_WS_URL}")
        except Exception as e:
            logger.error(f"WebSocket connection failed: {e}")
            self.is_connected = False
    
    async def disconnect(self):
        """Disconnect from API Bridge"""
        if self.is_connected:
            await self.sio.disconnect()
            self.is_connected = False
    
    async def send_task(self, worker_id: str, url: str, prompt: str):
        """Send task to worker via API Bridge"""
        if not self.is_connected:
            logger.error("WebSocket not connected")
            raise Exception("WebSocket not connected")
        
        await self.sio.emit('send-task-to-worker', {
            'workerId': worker_id,
            'url': url,
            'prompt': prompt
        })
        logger.info(f"📤 Task sent to {worker_id}: {url}")
    
    def set_event_callback(self, callback):
        """Set callback for handling events"""
        self.event_callback = callback

# Singleton instance
api_ws_client = APIWebSocketClient()