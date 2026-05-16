from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from config.settings import settings
from utils.logger import get_logger
from routes import dashboard, workers, tasks, analytics, reports, health
from services.apiBridgeService import api_bridge_service
from services.schedulerService import start_scheduler

logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info("🚀 Starting Sane-AI Brain...")
    
    # Initialize API Bridge connection
    await api_bridge_service.initialize()
    
    # Start scheduler
    start_scheduler()
    
    # Create necessary directories
    os.makedirs(settings.REPORT_PATH, exist_ok=True)
    os.makedirs(settings.SCREENSHOT_PATH, exist_ok=True)
    os.makedirs(os.path.dirname(settings.CHROMA_DB_PATH), exist_ok=True)
    os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)
    
    logger.info(f"✅ Brain started on http://{settings.BRAIN_HOST}:{settings.BRAIN_PORT}")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Sane-AI Brain...")
    await api_bridge_service.close()
    logger.info("✅ Shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Sane-AI Brain",
    description="AI Orchestration System for Test Automation",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from routes import auth as auth_router
from routes import workers as workers_router
from routes import tasks as tasks_router
from routes import analytics as analytics_router
from routes import reports as reports_router
from routes import health as health_router

app.include_router(auth_router.router, prefix="/api", tags=["Auth"])
app.include_router(workers_router.router, prefix="/api", tags=["Workers"])
app.include_router(tasks_router.router, prefix="/api", tags=["Tasks"])
app.include_router(analytics_router.router, prefix="/api", tags=["Analytics"])
app.include_router(reports_router.router, prefix="/api", tags=["Reports"])
app.include_router(health_router.router, prefix="/api", tags=["Health"])

@app.get("/")
async def root():
    return {
        "name": "Sane-AI Brain",
        "version": "1.0.0",
        "status": "running",
        "api_bridge": settings.API_URL
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.BRAIN_HOST,
        port=settings.BRAIN_PORT,
        reload=settings.DEBUG
    )