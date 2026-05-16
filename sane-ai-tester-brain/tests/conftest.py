import pytest
import asyncio
from typing import AsyncGenerator
from httpx import AsyncClient
from fastapi import FastAPI

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from main import app

@pytest.fixture
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def client() -> AsyncGenerator:
    """Create test client"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
def test_app() -> FastAPI:
    """Return FastAPI app instance"""
    return app

@pytest.fixture
def sample_worker_data():
    """Sample worker data for tests"""
    return {
        "worker_id": "sane-tester-001",
        "nickname": "Test Worker",
        "machine_id": "test-machine-123",
        "system_ip": "127.0.0.1",
        "os_platform": "test",
        "status": "online"
    }

@pytest.fixture
def sample_task_data():
    """Sample task data for tests"""
    return {
        "worker_id": "sane-tester-001",
        "url": "https://example.com",
        "prompt": "Test the homepage"
    }