from fastapi import APIRouter
from fastapi.responses import JSONResponse
from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/custom-tasks")
async def get_all_custom_tasks():
    """Get all custom tasks from Node.js API"""
    try:
        data = await api_bridge_service.get_all_custom_tasks()
        return data
    except Exception as e:
        logger.error(f"Failed to get custom tasks: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/custom-tasks")
async def create_custom_task(task_data: dict):
    """Create a custom task via Node.js API"""
    try:
        data = await api_bridge_service.create_custom_task(task_data)
        return data
    except Exception as e:
        logger.error(f"Failed to create custom task: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.put("/custom-tasks/{custom_task_id}/status")
async def update_custom_task_status(custom_task_id: str, status_data: dict):
    """Update custom task status"""
    try:
        status = status_data.get("status")
        data = await api_bridge_service.update_custom_task_status(custom_task_id, status)
        return data
    except Exception as e:
        logger.error(f"Failed to update custom task status {custom_task_id}: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.put("/custom-tasks/{custom_task_id}")
async def update_custom_task(custom_task_id: str, task_data: dict):
    """Update custom task fields"""
    try:
        data = await api_bridge_service.update_custom_task(custom_task_id, task_data)
        return data
    except Exception as e:
        logger.error(f"Failed to update custom task {custom_task_id}: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/custom-tasks/start-brain-agent")
async def start_brain_agent():
    """Trigger the Brain Agent QA Director Orchestration workflow"""
    from services.aiOrchestratorService import ai_orchestrator
    try:
        data = await ai_orchestrator.run_brain_agent_orchestration()
        return data
    except Exception as e:
        logger.error(f"Brain Agent orchestration failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.delete("/custom-tasks/{custom_task_id}")
async def delete_custom_task(custom_task_id: str):
    """Delete a custom task"""
    try:
        data = await api_bridge_service.delete_custom_task(custom_task_id)
        return data
    except Exception as e:
        logger.error(f"Failed to delete custom task {custom_task_id}: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
