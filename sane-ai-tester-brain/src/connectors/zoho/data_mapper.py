from typing import Dict, Any, List
from datetime import datetime
from constants.status import ZOHO_STATUS_MAP

class ZohoDataMapper:
    """Map Zoho API data to internal format"""
    
    @staticmethod
    def map_item_to_test_task(item: Dict[str, Any]) -> Dict[str, Any]:
        """Map Zoho item to test task"""
        return {
            "id": item.get("id"),
            "name": item.get("name"),
            "description": item.get("description", ""),
            "status": ZOHO_STATUS_MAP.get(item.get("status", "open"), "TODO"),
            "priority": item.get("priority", "Medium"),
            "assigned_to": item.get("owner", {}).get("name"),
            "created_time": item.get("created_time"),
            "updated_time": item.get("modified_time"),
            "source": "zoho_sprint",
            "url": item.get("link", {}).get("self", ""),
            "attachments": item.get("attachment_count", 0),
            "comments": item.get("comment_count", 0)
        }
    
    @staticmethod
    def map_sprint_to_project(sprint: Dict[str, Any]) -> Dict[str, Any]:
        """Map Zoho sprint to project"""
        return {
            "id": sprint.get("id"),
            "name": sprint.get("name"),
            "description": sprint.get("description", ""),
            "status": sprint.get("status", "active"),
            "start_date": sprint.get("start_date"),
            "end_date": sprint.get("end_date"),
            "total_items": sprint.get("total_items", 0),
            "completed_items": sprint.get("completed_items", 0)
        }
    
    @staticmethod
    def map_user_to_worker(user: Dict[str, Any]) -> Dict[str, Any]:
        """Map Zoho user to worker format"""
        return {
            "worker_id": f"zoho_{user.get('id')}",
            "nickname": user.get("name", ""),
            "email": user.get("email", ""),
            "role": user.get("role", "tester"),
            "status": "offline",  # Will be updated when worker connects
            "source": "zoho"
        }

# Singleton instance
zoho_mapper = ZohoDataMapper()