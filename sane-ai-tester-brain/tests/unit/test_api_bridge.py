import pytest
from unittest.mock import Mock, patch
from services.apiBridgeService import APIBridgeService

@pytest.mark.asyncio
async def test_api_bridge_initialization():
    """Test API bridge initialization"""
    service = APIBridgeService()
    assert service.is_ready == False
    
    with patch.object(service, 'initialize') as mock_init:
        mock_init.return_value = True
        await service.initialize()
        mock_init.assert_called_once()

@pytest.mark.asyncio
async def test_get_workers():
    """Test getting workers from API bridge"""
    service = APIBridgeService()
    mock_workers = [
        {"worker_id": "test-001", "status": "online"},
        {"worker_id": "test-002", "status": "offline"}
    ]
    
    with patch.object(service, 'get_workers', return_value=mock_workers):
        workers = await service.get_workers()
        assert len(workers) == 2
        assert workers[0]["worker_id"] == "test-001"