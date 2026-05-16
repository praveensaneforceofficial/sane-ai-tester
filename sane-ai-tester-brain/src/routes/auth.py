from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from connectors.api_bridge.rest_client import api_rest_client
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/auth/login")
async def login(req: LoginRequest):
    """Proxy login request to API Bridge"""
    try:
        return await api_rest_client.post("/api/auth/login", req.dict())
    except Exception as e:
        logger.error(f"Login proxy failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

@router.get("/auth/me")
async def get_me():
    """Get current user info"""
    try:
        return await api_rest_client.get("/api/auth/me")
    except Exception as e:
        logger.error(f"Get me failed: {e}")
        raise HTTPException(status_code=401, detail="Unauthorized")
