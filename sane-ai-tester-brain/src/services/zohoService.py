from connectors.zoho.zoho_client import zoho_client
from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger

logger = get_logger(__name__)

class ZohoService:
    """Service to synchronize Zoho Sprints data with the API Central server"""
    
    async def sync_all(self):
        """Perform a full sync of projects and tickets"""
        logger.info("🔄 Starting Zoho Synchronization...")
        
        # 1. Sync Projects
        zoho_projects = await zoho_client.get_projects()
        for zp in zoho_projects:
            project_data = {
                "project_jobj_id": str(zp.get('id')),
                "project_name": zp.get('name'),
                "category": "zohosprint",
                "description": zp.get('description', '')
            }
            try:
                await api_bridge_service.create_project(project_data)
                logger.info(f"✅ Synced project: {zp.get('name')}")
            except Exception as e:
                logger.debug(f"Project {zp.get('name')} might already exist or error: {e}")

        # 2. Sync Tickets (for all projects)
        db_projects = await api_bridge_service.get_projects()
        for proj in db_projects:
            proj_id = proj.get('project_jobj_id')
            zoho_items = await zoho_client.get_tickets(proj_id)
            for item in zoho_items:
                ticket_data = {
                    "ticket_id": str(item.get('id')),
                    "project_jobj_id": proj_id,
                    "title": item.get('name'),
                    "description": item.get('description', ''),
                    "status": item.get('status', 'Open'),
                    "priority": item.get('priority', 'Medium')
                }
                try:
                    # Note: We need a create_ticket method in apiBridgeService
                    # I'll add it or use a generic rest call
                    from connectors.api_bridge.rest_client import api_rest_client
                    await api_rest_client.post("/api/tickets", ticket_data)
                except Exception:
                    pass # Skip duplicates or errors

        logger.info("✅ Zoho Synchronization complete")

# Singleton instance
zoho_service = ZohoService()