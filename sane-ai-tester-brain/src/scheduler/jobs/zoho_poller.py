from connectors.zoho.zoho_scraper import zoho_scraper
from services.aiOrchestratorService import ai_orchestrator
from services.apiBridgeService import api_bridge_service
from utils.logger import get_logger

logger = get_logger(__name__)

async def poll_zoho_sprint():
    """Poll Zoho Sprint for new/updated items"""
    logger.info("🔄 Polling Zoho Sprint for updates...")
    
    try:
        # Get active sprints
        sprints = await zoho_scraper.get_active_sprints()
        
        for sprint in sprints:
            # Get updates
            updates = await zoho_scraper.poll_sprint_updates(sprint['id'])
            
            for item in updates:
                logger.info(f"Processing Zoho item: {item['name']}")
                
                # Generate test case using AI
                test_case = await ai_orchestrator.generate_test_case(item)
                
                # Find available worker
                workers = await api_bridge_service.get_workers()
                online_workers = [w for w in workers if w.get('status') == 'online']
                
                if online_workers:
                    # Send task to first available worker
                    worker = online_workers[0]
                    await api_bridge_service.send_task(
                        worker_id=worker['worker_id'],
                        url=test_case.get('url', ''),
                        prompt=test_case.get('prompt', '')
                    )
                    logger.info(f"Task sent to worker {worker['worker_id']}")
                else:
                    logger.warning("No online workers available")
                    
    except Exception as e:
        logger.error(f"Zoho poller failed: {e}")