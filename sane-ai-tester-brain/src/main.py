from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from config.settings import settings
from utils.logger import get_logger
from services.apiBridgeService import api_bridge_service
from services.schedulerService import start_scheduler

logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info("Starting Sane-AI Brain...")
    
    # Initialize API Bridge connection
    await api_bridge_service.initialize()
    
    # Start scheduler
    start_scheduler()
    
    # Create necessary directories
    os.makedirs(settings.REPORT_PATH, exist_ok=True)
    os.makedirs(settings.SCREENSHOT_PATH, exist_ok=True)
    os.makedirs(os.path.dirname(settings.CHROMA_DB_PATH), exist_ok=True)
    os.makedirs(os.path.dirname(settings.LOG_FILE), exist_ok=True)
    
    logger.info(f"Brain started on http://{settings.BRAIN_HOST}:{settings.BRAIN_PORT}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Sane-AI Brain...")
    await api_bridge_service.close()
    logger.info("Shutdown complete")

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
from routes import health as health_router
from routes import ws_bridge as ws_bridge_router

app.include_router(health_router.router, prefix="/brain_api", tags=["Health"])
app.include_router(ws_bridge_router.router, tags=["WebSocket Bridge"])

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