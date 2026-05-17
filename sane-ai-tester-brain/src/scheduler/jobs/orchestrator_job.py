from services.aiOrchestratorService import ai_orchestrator
from utils.logger import get_logger
import asyncio

logger = get_logger(__name__)

def run_orchestration():
    """Trigger AI Orchestration for Custom Tasks"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        # Run orchestration logic
        results = loop.run_until_complete(ai_orchestrator.run_brain_agent_orchestration())
        loop.close()
        
        # Log summary if any actions were processed
        if results and any(v > 0 for k, v in results.items() if isinstance(v, int)):
            logger.info(f"🤖 AI Orchestration automated run completed: {results}")
    except Exception as e:
        logger.error(f"Error in automated AI orchestration job: {e}")
