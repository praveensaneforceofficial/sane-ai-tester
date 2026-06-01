import asyncio
from typing import List, Dict, Any
from utils.logger import get_logger
from connectors.api_bridge.rest_client import api_rest_client
from connectors.github_client import github_client

logger = get_logger(__name__)

class GitTriggerPoller:
    """Polls the API for pending Git triggers and processes them."""
    
    def __init__(self):
        self.is_running = False
        
    async def process_triggers(self):
        """Fetch and process pending git triggers"""
        try:
            # 1. Fetch triggers
            triggers = await api_rest_client.get("/api/tasks/git-triggers")
            if not triggers:
                return
                
            pending_triggers = [t for t in triggers if t.get('status') == 'pending']
            if not pending_triggers:
                return
                
            # 2. Consolidate by pr_number
            consolidated = {}
            for trigger in pending_triggers:
                pr_number = trigger.get('pr_number')
                if pr_number not in consolidated:
                    consolidated[pr_number] = []
                consolidated[pr_number].append(trigger)
                
            # 3. Process each PR group
            for pr_number, trigger_group in consolidated.items():
                await self._process_pr_group(pr_number, trigger_group)
                
        except Exception as e:
            logger.error(f"Error processing git triggers: {e}")

    async def _process_pr_group(self, pr_number: int, triggers: List[Dict[Any, Any]]):
        """Process a group of triggers for a single PR"""
        # We consider the trigger with testing case description or just the latest one
        has_testing_case = False
        main_trigger = triggers[0]
        
        for t in triggers:
            desc = (t.get('description') or "").strip()
            # Create a task if the description has more than 4 lines
            if len(desc) > 4:
                has_testing_case = True
                main_trigger = t
                break
                
        repository = main_trigger.get('repository')
        
        if not has_testing_case:
            logger.info(f"PR #{pr_number} has no testing cases. Marking triggers as completed.")
            # Mark all as completed
            for t in triggers:
                await api_rest_client.put(f"/api/tasks/git-triggers/{t['id']}/status", {"status": "completed"})
            return
            
        logger.info(f"PR #{pr_number} contains testing cases. Initiating AI testing.")
        
        # 1. Create Worker Board Custom Task
        task_payload = {
            "title": f"Git PR #{pr_number} - Automated Testing",
            "description": f"[GIT_TRIGGER_REPO: {repository}]\n[GIT_TRIGGER_PR: {pr_number}]\n\n{main_trigger.get('description')}",
            "priority": "high",
            "status": "TODO",
            "project_jobj_id": "29601000000786834"
        }
        
        try:
            task = await api_rest_client.post("/api/custom-tasks", task_payload)
            logger.info(f"Created custom task {task.get('custom_task_id')} for PR #{pr_number}")
        except Exception as e:
            logger.error(f"Failed to create custom task for PR #{pr_number}: {e}")
            
        # 2. Update trigger statuses to in_progress
        for t in triggers:
            await api_rest_client.put(f"/api/tasks/git-triggers/{t['id']}/status", {"status": "in_progress"})
            
        # 3. Post GitHub Comments
        initial_comment = "Sane AI Tester :\nStatus : Init(task created)"
        await github_client.post_pr_comment(repository, pr_number, initial_comment)

git_trigger_poller = GitTriggerPoller()

def poll_git_triggers():
    """Trigger Git Polling for new pending triggers"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(git_trigger_poller.process_triggers())
        loop.close()
    except Exception as e:
        logger.error(f"Error in git trigger poller job: {e}")
