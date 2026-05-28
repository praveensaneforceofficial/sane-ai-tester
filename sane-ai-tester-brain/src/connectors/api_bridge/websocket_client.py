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
            try:
                await self.sio.emit('brain:register', {})
                logger.info("🧠 Sent brain:register to API")
            except Exception as e:
                logger.error(f"Failed to register Brain client: {e}")
        
        @self.sio.event
        async def disconnect():
            logger.warning("⚠️ Disconnected from API Bridge WebSocket")
            self.is_connected = False
            try:
                from services.aiOrchestratorService import ai_orchestrator
                ai_orchestrator.abort_requested = True
                logger.info("🛑 Abort request set in AI Orchestrator due to disconnect")
            except Exception as e:
                pass
            
        @self.sio.on('brain:command')
        async def on_brain_command(data):
            logger.info(f"🧠 Received brain command via Socket.IO: {data}")
            import asyncio
            asyncio.create_task(self._process_brain_command(data))
        
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
    
    async def _process_brain_command(self, data: Dict[str, Any]):
        job_id = data.get("job_id")
        msg_type = data.get("type")
        
        if not msg_type:
            logger.warning("Received brain command without type")
            await self.sio.emit('brain:response', {
                "job_id": job_id,
                "type": "error",
                "error": "Missing message type"
            })
            return
            
        logger.info(f"🧠 Processing command: {msg_type} (Job ID: {job_id})")
        
        try:
            from services.aiOrchestratorService import ai_orchestrator
            
            if msg_type == "orchestrate":
                result = await ai_orchestrator.run_brain_agent_orchestration()
                await self.sio.emit('brain:response', {
                    "job_id": job_id,
                    "type": "result",
                    "data": result
                })
                
            elif msg_type == "check-ai":
                result = await ai_orchestrator.check_ai_availability()
                await self.sio.emit('brain:response', {
                    "job_id": job_id,
                    "type": "result",
                    "data": result
                })
                
            elif msg_type == "generate-prompt":
                url = data.get("url")
                if not url:
                    raise ValueError("url is required for generate-prompt")
                prompt = await ai_orchestrator.generate_test_prompt(url)
                await self.sio.emit('brain:response', {
                    "job_id": job_id,
                    "type": "result",
                    "data": {"prompt": prompt}
                })
                
            elif msg_type in ("stop", "cancel"):
                ai_orchestrator.abort_requested = True
                logger.info("🛑 Abort request set in AI Orchestrator via Socket.IO command")
                await self.sio.emit('brain:response', {
                    "job_id": job_id,
                    "type": "result",
                    "data": {"status": "stopping"}
                })
                
            else:
                logger.warning(f"Unknown command type: {msg_type}")
                await self.sio.emit('brain:response', {
                    "job_id": job_id,
                    "type": "error",
                    "error": f"Unknown command type: {msg_type}"
                })
                
        except Exception as e:
            logger.error(f"Error executing command {msg_type} ({job_id}): {e}", exc_info=True)
            await self.sio.emit('brain:response', {
                "job_id": job_id,
                "type": "error",
                "error": str(e)
            })

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