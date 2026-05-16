from fastapi import APIRouter
from typing import Dict, Any
from controllers.healthController import health_controller

router = APIRouter()

@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """Basic health check"""
    return await health_controller.check_health()

@router.get("/health/detailed")
async def detailed_health_check() -> Dict[str, Any]:
    """Detailed health check"""
    return await health_controller.check_detailed_health()