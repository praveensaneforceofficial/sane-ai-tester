from connectors.zoho.zoho_client import zoho_client
from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger

logger = get_logger(__name__)

class ZohoService:
    """Service to synchronize Zoho Sprints data with the API Central server"""
    
    async def sync_all(self):
        """Perform a full sync of projects and tickets"""
        logger.info("🔄 Starting Zoho Synchronization...")
        
        # 1. Sync Projects via API Bridge (Prototype Scraper)
        try:
            await api_bridge_service.trigger_zoho_sync()
            logger.info("✅ Synced projects via Node API Bridge scraper")
        except Exception as e:
            logger.error(f"❌ Error triggering Zoho sync on API bridge: {e}")

        # 2. Sync Tickets (for all projects)
        # TEMPORARILY DISABLED: The official Zoho API client throws 400 errors because OAuth isn't set up yet.
        # We will enable this once the official API is configured, or build a Puppeteer scraper for tickets.
        '''
        db_projects = await api_bridge_service.get_all_projects()
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
                    from connectors.api_bridge.rest_client import api_rest_client
                    await api_rest_client.post("/api/tickets", ticket_data)
                except Exception:
                    pass # Skip duplicates or errors
        '''

        logger.info("✅ Zoho Synchronization complete")

# Singleton instance
zoho_service = ZohoService()