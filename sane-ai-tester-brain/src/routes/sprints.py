from typing import Optional
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse
from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/sprints/{project_id}")
async def get_sprints(project_id: str):
    """Get all sprints for a specific project"""
    try:
        data = await api_bridge_service.get_sprints(project_id)
        return data
    except Exception as e:
        logger.error(f"Failed to get sprints for project {project_id}: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/sprints/{project_id}/{sprint_id}/items")
async def get_sprint_items(project_id: str, sprint_id: str, lane_id: Optional[str] = Query(None)):
    """Get sprint items (cards) for a specific sprint"""
    try:
        data = await api_bridge_service.get_sprint_items(project_id, sprint_id, lane_id)
        return data
    except Exception as e:
        logger.error(f"Failed to get sprint items for project {project_id}, sprint {sprint_id}: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/sprints/{project_id}/{sprint_id}/board-url")
async def get_sprint_board_url(project_id: str, sprint_id: str):
    """Get the direct board URL for a sprint"""
    try:
        data = await api_bridge_service.get_sprint_board_url(project_id, sprint_id)
        return data
    except Exception as e:
        logger.error(f"Failed to get board URL for project {project_id}, sprint {sprint_id}: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
