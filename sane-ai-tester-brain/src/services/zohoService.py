from typing import List, Dict, Any, Optional
from connectors.zoho.zoho_scraper import zoho_scraper
from connectors.zoho.zoho_client import zoho_client
from connectors.zoho.data_mapper import zoho_mapper
from ai.agents.testPlanner import test_planner
from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger

logger = get_logger(__name__)

class ZohoService:
    """Service for Zoho Sprint integration"""
    
    async def sync_sprint_items(self, sprint_id: str) -> List[Dict[str, Any]]:
        """Sync items from Zoho sprint"""
        try:
            items = await zoho_scraper.poll_sprint_updates(sprint_id)
            
            for item in items:
                # Convert to test task
                test_task = zoho_mapper.map_item_to_test_task(item)
                
                # Generate test cases using AI
                test_cases = await test_planner.generate_test_plan([test_task])
                
                # Find available worker
                workers = await api_bridge_service.get_workers()
                online_workers = [w for w in workers if w.get('status') == 'online']
                
                if online_workers and test_cases:
                    worker = online_workers[0]
                    for test_case in test_cases[:3]:  # Send first 3 test cases
                        await api_bridge_service.send_task(
                            worker_id=worker['worker_id'],
                            url=test_case.get('url', ''),
                            prompt=test_case.get('prompt', '')
                        )
                        logger.info(f"Test case sent to {worker['nickname']}")
            
            return items
            
        except Exception as e:
            logger.error(f"Failed to sync Zoho items: {e}")
            return []
    
    async def get_active_sprints(self) -> List[Dict[str, Any]]:
        """Get active sprints"""
        try:
            return await zoho_scraper.get_active_sprints()
        except Exception as e:
            logger.error(f"Failed to get active sprints: {e}")
            return []
    
    async def update_zoho_status(self, item_id: str, status: str) -> bool:
        """Update item status in Zoho"""
        try:
            await zoho_client.update_item_status(item_id, status)
            logger.info(f"Updated Zoho item {item_id} status to {status}")
            return True
        except Exception as e:
            logger.error(f"Failed to update Zoho status: {e}")
            return False

zoho_service = ZohoService()