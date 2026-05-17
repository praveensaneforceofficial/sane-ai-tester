from fastapi import APIRouter
from fastapi.responses import JSONResponse
from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)


@router.get("/projects")
async def get_all_projects():
    """Get all projects from Node.js API"""
    try:
        data = await api_bridge_service.get_all_projects()
        return data
    except Exception as e:
        logger.error(f"Failed to get projects: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/projects/active")
async def get_active_projects():
    """Get active projects from Node.js API"""
    try:
        data = await api_bridge_service.get_active_projects()
        return data
    except Exception as e:
        logger.error(f"Failed to get active projects: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/projects")
async def create_project(project_data: dict):
    """Create a project via Node.js API"""
    try:
        data = await api_bridge_service.create_project(project_data)
        return data
    except Exception as e:
        logger.error(f"Failed to create project: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.post("/projects/sync")
async def sync_zoho_projects():
    """
    Trigger Puppeteer-based Zoho Sprints scraper via Node.js API.
    This is a long-running request (up to 2 minutes).
    The Node.js side will open a browser, wait for Zoho data, and return the project list.
    """
    try:
        logger.info("Triggering Zoho Sprints Puppeteer sync via Node.js API...")
        result = await api_bridge_service.trigger_zoho_sync()
        logger.info(f"Zoho sync complete: {result.get('message', '')}")
        return result
    except Exception as e:
        logger.error(f"Zoho sync failed: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.get("/projects/{project_id}")
async def get_project_by_id(project_id: str):
    """Get a specific project by ID"""
    try:
        data = await api_bridge_service.get_project_by_id(project_id)
        return data
    except Exception as e:
        logger.error(f"Failed to get project {project_id}: {e}")
        return JSONResponse(status_code=404, content={"error": str(e)})


@router.put("/projects/{project_id}")
async def update_project(project_id: str, project_data: dict):
    """Update a project"""
    try:
        data = await api_bridge_service.update_project(project_id, project_data)
        return data
    except Exception as e:
        logger.error(f"Failed to update project {project_id}: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


@router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    try:
        data = await api_bridge_service.delete_project(project_id)
        return data
    except Exception as e:
        logger.error(f"Failed to delete project {project_id}: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})
