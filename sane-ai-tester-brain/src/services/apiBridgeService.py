from typing import List, Dict, Any, Optional
from connectors.api_bridge.rest_client import api_rest_client
from connectors.api_bridge.websocket_client import api_ws_client
from connectors.api_bridge.event_handlers import event_handlers
from utils.logger import get_logger

logger = get_logger(__name__)

class APIBridgeService:
    """Exhaustive Service for communicating with API Bridge Central Server"""
    
    def __init__(self):
        self.is_ready = False
    
    async def initialize(self):
        """Initialize connection to API Bridge"""
        api_ws_client.set_event_callback(event_handlers.handle_event)
        await api_ws_client.connect()
        self.is_ready = True
        logger.info("API Bridge Service initialized")
    
    # --- 1. Worker Methods ---
    async def get_all_workers(self) -> List[Dict]:
        return await api_rest_client.get("/api/workers")
    
    async def get_online_workers(self) -> List[Dict]:
        return await api_rest_client.get("/api/workers/online")
    
    async def get_worker_by_id(self, worker_id: str) -> Dict:
        return await api_rest_client.get(f"/api/workers/{worker_id}")
    
    async def register_worker(self, worker_data: Dict) -> Dict:
        return await api_rest_client.post("/api/workers/register", worker_data)
    
    async def update_worker_status(self, worker_id: str, action: str) -> Dict:
        return await api_rest_client.put(f"/api/workers/{worker_id}/status", {"action": action})
    
    async def update_worker_details(self, worker_id: str, worker_data: Dict) -> Dict:
        return await api_rest_client.put(f"/api/workers/{worker_id}", worker_data)
    
    async def delete_worker(self, worker_id: str) -> Dict:
        return await api_rest_client.delete(f"/api/workers/{worker_id}")
    
    async def get_worker_heartbeats(self, worker_id: str) -> List[Dict]:
        return await api_rest_client.get(f"/api/workers/{worker_id}/heartbeat")

    # --- 2. Task Methods ---
    async def get_all_tasks(self) -> List[Dict]:
        return await api_rest_client.get("/api/tasks")
    
    async def get_task_by_id(self, task_id: str) -> Dict:
        return await api_rest_client.get(f"/api/tasks/{task_id}")
    
    async def create_task(self, task_data: Dict) -> Dict:
        return await api_rest_client.post("/api/tasks", task_data)
    
    async def update_task_status(self, task_id: str, status: str, error: Optional[str] = None) -> Dict:
        return await api_rest_client.put(f"/api/tasks/{task_id}/status", {"status": status, "error": error})
    
    async def assign_task_via_rest(self, task_id: str, worker_id: str) -> Dict:
        return await api_rest_client.put(f"/api/tasks/{task_id}/assign", {"workerId": worker_id})
    
    async def retry_task(self, task_id: str) -> Dict:
        return await api_rest_client.post(f"/api/tasks/{task_id}/retry")
    
    async def cancel_task_via_rest(self, task_id: str) -> Dict:
        return await api_rest_client.delete(f"/api/tasks/{task_id}")
    
    async def get_tasks_by_worker(self, worker_id: str) -> List[Dict]:
        return await api_rest_client.get(f"/api/tasks/worker/{worker_id}")
    
    async def get_tasks_by_status(self, status: str) -> List[Dict]:
        return await api_rest_client.get(f"/api/tasks/status/{status}")
    
    async def add_task_action(self, task_id: str, action_data: Dict) -> Dict:
        return await api_rest_client.post(f"/api/tasks/{task_id}/actions", action_data)
    
    async def get_task_actions(self, task_id: str) -> List[Dict]:
        return await api_rest_client.get(f"/api/tasks/{task_id}/actions")

    # --- 3. Project Methods ---
    async def get_all_projects(self) -> List[Dict]:
        return await api_rest_client.get("/api/projects")
    
    async def create_project(self, project_data: Dict) -> Dict:
        return await api_rest_client.post("/api/projects", project_data)
    
    async def get_active_projects(self) -> List[Dict]:
        return await api_rest_client.get("/api/projects/active")
    
    async def trigger_zoho_sync(self) -> Dict:
        # Use post_long since Puppeteer can take up to 2 minutes to scrape
        return await api_rest_client.post_long("/api/projects/sync", timeout=180.0)
    
    async def get_projects_by_category(self, category: str) -> List[Dict]:
        return await api_rest_client.get(f"/api/projects/category/{category}")
    
    async def get_project_by_id(self, project_id: str) -> Dict:
        return await api_rest_client.get(f"/api/projects/{project_id}")
    
    async def update_project(self, project_id: str, project_data: Dict) -> Dict:
        return await api_rest_client.put(f"/api/projects/{project_id}", project_data)
    
    async def delete_project(self, project_id: str) -> Dict:
        return await api_rest_client.delete(f"/api/projects/{project_id}")

    # --- Sprints Methods ---
    async def get_sprints(self, project_id: str) -> Dict:
        return await api_rest_client.get(f"/api/sprints/{project_id}")
    
    async def get_sprint_items(self, project_id: str, sprint_id: str, lane_id: Optional[str] = None) -> Dict:
        params = {"laneId": lane_id} if lane_id else {}
        return await api_rest_client.get(f"/api/sprints/{project_id}/{sprint_id}/items", params=params)
    
    async def get_sprint_board_url(self, project_id: str, sprint_id: str) -> Dict:
        return await api_rest_client.get(f"/api/sprints/{project_id}/{sprint_id}/board-url")

    # --- 4. Ticket Methods ---
    async def get_all_tickets(self) -> List[Dict]:
        return await api_rest_client.get("/api/tickets")
    
    async def create_ticket(self, ticket_data: Dict) -> Dict:
        return await api_rest_client.post("/api/tickets", ticket_data)
    
    async def get_ai_testing_tickets(self) -> List[Dict]:
        return await api_rest_client.get("/api/tickets/ai-testing")
    
    async def get_tickets_by_project(self, project_id: str) -> List[Dict]:
        return await api_rest_client.get(f"/api/tickets/project/{project_id}")
    
    async def get_ticket_by_id(self, ticket_id: str) -> Dict:
        return await api_rest_client.get(f"/api/tickets/{ticket_id}")
    
    async def update_ticket(self, ticket_id: str, ticket_data: Dict) -> Dict:
        return await api_rest_client.put(f"/api/tickets/{ticket_id}", ticket_data)
    
    async def update_ticket_ai_status(self, ticket_id: str, status: str, task_id: Optional[str] = None) -> Dict:
        return await api_rest_client.put(f"/api/tickets/{ticket_id}/ai-status", {"status": status, "task_id": task_id})
    
    async def get_ticket_comments(self, ticket_id: str) -> List[Dict]:
        return await api_rest_client.get(f"/api/tickets/{ticket_id}/comments")
    
    async def add_ticket_comment(self, ticket_id: str, comment_data: Dict) -> Dict:
        return await api_rest_client.post(f"/api/tickets/{ticket_id}/comments", comment_data)

    # --- 5. Report Methods ---
    async def get_all_reports(self) -> List[Dict]:
        return await api_rest_client.get("/api/reports")
    
    async def generate_report(self, report_data: Dict) -> Dict:
        return await api_rest_client.post("/api/reports", report_data)
    
    async def get_report_by_task(self, task_id: str) -> Dict:
        return await api_rest_client.get(f"/api/reports/task/{task_id}")
    
    async def get_reports_by_worker(self, worker_id: str) -> List[Dict]:
        return await api_rest_client.get(f"/api/reports/worker/{worker_id}")
    
    async def get_reports_by_project(self, project_name: str) -> List[Dict]:
        return await api_rest_client.get(f"/api/reports/project/{project_name}")
    
    async def get_report_by_id(self, report_id: str) -> Dict:
        return await api_rest_client.get(f"/api/reports/{report_id}")
    
    async def delete_report(self, report_id: str) -> Dict:
        return await api_rest_client.delete(f"/api/reports/{report_id}")
    
    async def download_report_metadata(self, report_id: str) -> Dict:
        return await api_rest_client.get(f"/api/reports/{report_id}/download")

    # --- 6. Error Methods ---
    async def get_all_errors(self) -> List[Dict]:
        return await api_rest_client.get("/api/errors")
    
    async def create_error_log(self, error_data: Dict) -> Dict:
        return await api_rest_client.post("/api/errors", error_data)
    
    async def get_errors_by_task(self, task_id: str) -> List[Dict]:
        return await api_rest_client.get(f"/api/errors/task/{task_id}")
    
    async def get_errors_by_worker(self, worker_id: str) -> List[Dict]:
        return await api_rest_client.get(f"/api/errors/worker/{worker_id}")
    
    async def get_errors_by_severity(self, severity: str) -> List[Dict]:
        return await api_rest_client.get(f"/api/errors/severity/{severity}")
    
    async def get_error_by_id(self, error_id: str) -> Dict:
        return await api_rest_client.get(f"/api/errors/{error_id}")
    
    async def resolve_error(self, error_id: str) -> Dict:
        return await api_rest_client.put(f"/api/errors/{error_id}/resolve")

    # --- 7. Analytics Methods ---
    async def get_dashboard_metrics(self) -> Dict:
        return await api_rest_client.get("/api/analytics/dashboard")
    
    async def get_worker_analytics(self) -> List[Dict]:
        return await api_rest_client.get("/api/analytics/workers")
    
    async def get_task_analytics(self) -> List[Dict]:
        return await api_rest_client.get("/api/analytics/tasks")
    
    async def get_error_analytics(self) -> List[Dict]:
        return await api_rest_client.get("/api/analytics/errors")
    
    async def get_success_rate_analytics(self) -> List[Dict]:
        return await api_rest_client.get("/api/analytics/success-rate")
    
    async def get_project_analytics(self) -> List[Dict]:
        return await api_rest_client.get("/api/analytics/projects")

    # --- 8. AI Usage Methods ---
    async def get_all_ai_usage(self) -> List[Dict]:
        return await api_rest_client.get("/api/ai-usage")
    
    async def log_ai_usage(self, usage_data: Dict) -> Dict:
        return await api_rest_client.post("/api/ai-usage", usage_data)
    
    async def get_ai_usage_summary(self) -> Dict:
        return await api_rest_client.get("/api/ai-usage/summary")
    
    async def get_ai_token_stats(self) -> List[Dict]:
        return await api_rest_client.get("/api/ai-usage/tokens")
    
    async def get_ai_usage_by_source(self, source: str) -> List[Dict]:
        return await api_rest_client.get(f"/api/ai-usage/source/{source}")

    # --- 9. Config Methods ---
    async def get_all_configs(self) -> List[Dict]:
        return await api_rest_client.get("/api/config")
    
    async def create_config(self, config_data: Dict) -> Dict:
        return await api_rest_client.post("/api/config", config_data)
    
    async def get_config_by_key(self, key: str) -> Dict:
        return await api_rest_client.get(f"/api/config/{key}")
    
    async def update_config(self, key: str, config_data: Dict) -> Dict:
        return await api_rest_client.put(f"/api/config/{key}", config_data)

    # --- 10. Health Methods ---
    async def get_basic_health(self) -> Dict:
        return await api_rest_client.get("/api/health")
    
    async def get_detailed_health(self) -> Dict:
        return await api_rest_client.get("/api/health/detailed")
    
    async def get_system_metrics_health(self) -> Dict:
        return await api_rest_client.get("/api/health/metrics")
    
    async def get_worker_health_summary(self) -> List[Dict]:
        return await api_rest_client.get("/api/health/workers")
    
    async def refresh_system_status(self) -> Dict:
        return await api_rest_client.post("/api/refresh-status")

    # --- Custom Task Methods ---
    async def get_all_custom_tasks(self) -> List[Dict]:
        return await api_rest_client.get("/api/custom-tasks")
    
    async def create_custom_task(self, task_data: Dict) -> Dict:
        return await api_rest_client.post("/api/custom-tasks", task_data)
    
    async def update_custom_task_status(self, custom_task_id: str, status: str) -> Dict:
        return await api_rest_client.put(f"/api/custom-tasks/{custom_task_id}/status", {"status": status})
    
    async def update_custom_task(self, custom_task_id: str, task_data: Dict) -> Dict:
        return await api_rest_client.put(f"/api/custom-tasks/{custom_task_id}", task_data)
    
    async def delete_custom_task(self, custom_task_id: str) -> Dict:
        return await api_rest_client.delete(f"/api/custom-tasks/{custom_task_id}")

    async def get_custom_task_actions(self, custom_task_id: str) -> List[Dict]:
        return await api_rest_client.get(f"/api/custom-tasks/{custom_task_id}/actions")

    # --- WebSocket Emitters (Real-time) ---
    async def emit_task_assign(self, worker_id: str, task_id: str, url: str, prompt: str):
        await api_ws_client.assign_task(worker_id, task_id, url, prompt)

    async def emit_task_cancel(self, worker_id: str, task_id: str):
        await api_ws_client.cancel_task(worker_id, task_id)

    async def close(self):
        await api_ws_client.disconnect()
        await api_rest_client.close()

# Singleton instance
api_bridge_service = APIBridgeService()