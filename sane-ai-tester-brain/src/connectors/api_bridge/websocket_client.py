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
        async def dashboard_update(data=None):
            logger.info("📡 Received dashboard:update event")
            await self._handle_event("dashboard:update", data)
        
        @self.sio.on('worker:online')
        async def worker_online(data):
            logger.info(f"🟢 Worker online: {data.get('nickname')}")
            await self._handle_event("worker:online", data)

        @self.sio.on('worker:offline')
        async def worker_offline(data):
            logger.info(f"🔴 Worker offline: {data.get('workerId')}")
            await self._handle_event("worker:offline", data)

        @self.sio.on('report:generated')
        async def report_generated(data):
            logger.info(f"📄 Report generated for task: {data.get('taskId')}")
            await self._handle_event("report:generated", data)
    
    async def _handle_event(self, event: str, data: Dict):
        """Handle incoming events"""
        if hasattr(self, 'event_callback'):
            await self.event_callback(event, data)
    
    async def connect(self):
        """Connect to API Bridge WebSocket"""
        try:
            await self.sio.connect(settings.API_URL) # Standard Socket.IO connection
            logger.info(f"Connecting to {settings.API_URL}")
        except Exception as e:
            logger.error(f"WebSocket connection failed: {e}")
            self.is_connected = False
    
    async def disconnect(self):
        """Disconnect from API Bridge"""
        if self.is_connected:
            await self.sio.disconnect()
            self.is_connected = False
    
    async def assign_task(self, worker_id: str, task_id: str, url: str, prompt: str):
        """Send task to worker via API Bridge"""
        if not self.is_connected:
            raise Exception("WebSocket not connected")
        
        await self.sio.emit('task:assign', {
            'workerId': worker_id,
            'taskId': task_id,
            'url': url,
            'prompt': prompt
        })
        logger.info(f"📤 Task {task_id} assigned to {worker_id}")

    async def cancel_task(self, worker_id: str, task_id: str):
        """Cancel task on worker via API Bridge"""
        if not self.is_connected:
            raise Exception("WebSocket not connected")
        
        await self.sio.emit('task:cancel', {
            'workerId': worker_id,
            'taskId': task_id
        })
        logger.info(f"🚫 Task {task_id} cancellation sent to {worker_id}")
    
    def set_event_callback(self, callback):
        """Set callback for handling events"""
        self.event_callback = callback

# Singleton instance
api_ws_client = APIWebSocketClient()