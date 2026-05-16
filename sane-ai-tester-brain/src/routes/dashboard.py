from fastapi import APIRouter
from controllers.dashboardController import dashboard_controller

router = APIRouter()

@router.get("/dashboard/metrics")
async def get_metrics():
    return await dashboard_controller.get_metrics()

@router.get("/dashboard/workers")
async def get_workers():
    return await dashboard_controller.get_worker_status()

@router.get("/dashboard/tasks/recent")
async def get_recent_tasks(limit: int = 5):
    return await dashboard_controller.get_recent_tasks(limit)