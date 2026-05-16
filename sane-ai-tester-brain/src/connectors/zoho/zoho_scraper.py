from typing import List, Dict, Optional
from datetime import datetime
from connectors.zoho.zoho_client import zoho_client
from utils.logger import get_logger
from constants.status import ZOHO_STATUS_MAP

logger = get_logger(__name__)

class ZohoScraper:
    """Scrape data from Zoho Sprint"""
    
    def __init__(self):
        self.last_poll_time = None
        self.cached_items = {}
    
    async def poll_sprint_updates(self, sprint_id: str) -> List[Dict]:
        """Poll sprint for updates"""
        try:
            items = await zoho_client.get_sprint_items(sprint_id)
            
            updates = []
            for item in items:
                item_id = item.get("id")
                last_modified = item.get("modified_time")
                
                # Check if item is new or updated
                if item_id not in self.cached_items or \
                   self.cached_items[item_id].get("modified_time") != last_modified:
                    
                    updates.append(self._map_to_test_task(item))
                    self.cached_items[item_id] = item
            
            if updates:
                logger.info(f"Found {len(updates)} updated items from Zoho")
            
            self.last_poll_time = datetime.now()
            return updates
            
        except Exception as e:
            logger.error(f"Failed to poll Zoho: {e}")
            return []
    
    def _map_to_test_task(self, item: Dict) -> Dict:
        """Map Zoho item to test task format"""
        return {
            "id": item.get("id"),
            "name": item.get("name"),
            "description": item.get("description", ""),
            "status": ZOHO_STATUS_MAP.get(item.get("status", "open"), "TODO"),
            "priority": item.get("priority", "Medium"),
            "assigned_to": item.get("owner", {}).get("name"),
            "created_time": item.get("created_time"),
            "updated_time": item.get("modified_time"),
            "source": "zoho_sprint"
        }
    
    async def get_active_sprints(self) -> List[Dict]:
        """Get active sprints"""
        # This would call Zoho API to get sprint list
        # For now, return placeholder
        return [
            {"id": "sprint_001", "name": "Current Sprint", "status": "active"}
        ]

# Singleton instance
zoho_scraper = ZohoScraper()