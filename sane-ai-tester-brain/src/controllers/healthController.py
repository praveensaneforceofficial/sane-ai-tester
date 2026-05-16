from typing import Dict, Any
from datetime import datetime
from fastapi import HTTPException
from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger

logger = get_logger(__name__)

class HealthController:
    """Controller for health checks"""
    
    async def check_health(self) -> Dict[str, Any]:
        """Basic health check"""
        return {
            "status": "healthy",
            "service": "sane-ai-brain",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0"
        }
    
    async def check_detailed_health(self) -> Dict[str, Any]:
        """Detailed health check with dependencies"""
        try:
            # Check API bridge
            api_bridge_status = "up" if api_bridge_service.is_ready else "down"
            
            # Try to get workers as a test
            workers = []
            try:
                workers = await api_bridge_service.get_workers()
            except Exception as e:
                logger.warning(f"API bridge test failed: {e}")
            
            return {
                "status": "healthy" if api_bridge_status == "up" else "degraded",
                "timestamp": datetime.now().isoformat(),
                "components": {
                    "brain": "up",
                    "api_bridge": api_bridge_status,
                    "database": "up"  # API bridge handles DB
                },
                "metrics": {
                    "total_workers": len(workers),
                    "connected": api_bridge_service.is_ready
                }
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            raise HTTPException(status_code=503, detail="Service unhealthy")

health_controller = HealthController()