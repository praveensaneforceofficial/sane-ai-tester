from typing import Dict, Any, Optional, List
from ai.llm.openai_client import openai_client
from ai.llm.ollama_client import ollama_client
from ai.agents.testPlanner import test_planner
from ai.agents.bugAnalyzer import bug_analyzer
from config.settings import settings
from utils.logger import get_logger

logger = get_logger(__name__)

class AIOrchestratorService:
    """Orchestrate AI operations using chat_completion standard"""
    
    async def generate_test_prompt(self, url: str) -> str:
        """Generate test prompt using AI"""
        try:
            prompt = f"You are a Senior QA Engineer. Generate a comprehensive test execution plan for the following URL: {url}. Provide a numbered list of steps."
            
            messages = [
                {"role": "system", "content": "You are a QA automation expert."},
                {"role": "user", "content": prompt}
            ]
            
            # Prefer OpenAI if key exists, else fallback to Ollama
            if settings.OPENAI_API_KEY:
                response = await openai_client.chat_completion(messages)
            else:
                response = await ollama_client.chat_completion(messages)
            
            return response or f"Perform full functional testing on {url}"
            
        except Exception as e:
            logger.error(f"Failed to generate test prompt: {e}")
            return f"Test the following URL: {url}"
    
    async def generate_test_case(self, requirement: Dict[str, Any]) -> Dict[str, Any]:
        """Generate test case from requirement"""
        try:
            test_cases = await test_planner.generate_test_plan([requirement])
            return test_cases[0] if test_cases else requirement
        except Exception as e:
            logger.error(f"Failed to generate test case: {e}")
            return requirement
    
    async def analyze_error(self, error: str, stack_trace: str) -> Dict[str, Any]:
        """Analyze error and provide fix suggestions"""
        try:
            return await bug_analyzer.analyze_bug({
                "error_message": error,
                "stack_trace": stack_trace
            })
        except Exception as e:
            logger.error(f"Failed to analyze error: {e}")
            return {"analysis": "Analysis failed", "severity": "Unknown"}

    async def check_ai_availability(self) -> Dict[str, Any]:
        """Check if AI provider (OpenAI or Ollama) is configured and working"""
        # 1. Check OpenAI
        if settings.OPENAI_API_KEY:
            try:
                from ai.llm.openai_client import openai_client
                if not openai_client.client:
                    return {
                        "available": False,
                        "provider": "OpenAI",
                        "error": "OpenAI client is not initialized. Please verify your OPENAI_API_KEY."
                    }
                # Quick lightweight validation call to OpenAI
                await openai_client.client.models.list()
                return {
                    "available": True,
                    "provider": "OpenAI",
                    "model": settings.OPENAI_MODEL
                }
            except Exception as e:
                logger.error(f"OpenAI API Key validation failed: {e}")
                return {
                    "available": False,
                    "provider": "OpenAI",
                    "error": f"OpenAI API key validation failed: {str(e)}. Please check your API key."
                }
        
        # 2. Check Ollama fallback
        else:
            try:
                import httpx
                # Check if Ollama service is reachable
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(f"{settings.OLLAMA_URL}/api/tags")
                    if response.status_code == 200:
                        return {
                            "available": True,
                            "provider": "Ollama",
                            "model": settings.OLLAMA_MODEL
                        }
                    else:
                        return {
                            "available": False,
                            "provider": "Ollama",
                            "error": f"Ollama returned status {response.status_code}."
                        }
            except Exception as e:
                logger.error(f"Ollama health check failed: {e}")
                return {
                    "available": False,
                    "provider": "None",
                    "error": "No AI API configured: OpenAI key is missing, and local Ollama is not running/unreachable."
                }

    async def run_brain_agent_orchestration(self) -> Dict[str, Any]:
        """Orchestrate custom tasks pipeline from TODO through Testing to Completion"""
        import json
        import time
        import re
        from services.apiBridgeService import api_bridge_service

        logger.info("Starting Brain Agent Orchestration...")
        summary_results = {
            "processed_todo": 0,
            "failed_todo": 0,
            "test_case_ready": 0,
            "testing_going": 0,
            "report_generation": 0,
            "completed_success": 0,
            "completed_failed": 0,
            "messages": []
        }

        try:
            # 1. Fetch available online agents and all custom tasks
            workers = await api_bridge_service.get_online_workers()
            all_custom_tasks = await api_bridge_service.get_all_custom_tasks()
            
            logger.info(f"Fetched {len(workers)} online workers and {len(all_custom_tasks)} custom tasks.")
        except Exception as e:
            logger.error(f"Error fetching dependencies for brain agent: {e}")
            return {"error": f"Failed to fetch workers/tasks: {str(e)}"}

        # ----------------------------------------------------
        # Phase 1: Process TODO tasks (Validate details enough)
        # ----------------------------------------------------
        todo_tasks = [t for t in all_custom_tasks if t.get('status', '').lower() in ('todo', 'pending')]

        for task in todo_tasks:
            summary_results["processed_todo"] += 1
            task_id = task.get('custom_task_id')
            title = task.get('title')
            description = task.get('description', '')
            priority = task.get('priority', 'medium')
            
            logger.info(f"Brain Agent checking if TODO task has enough details: {title} ({task_id})")

            # Ask LLM if the description has enough details to test a web page
            prompt = f"""
            You are an AI QA Evaluator.
            We have a task description submitted by a user for web page testing:
            Task Title: {title}
            Task Description: {description}
            
            Your job is to determine:
            Is this description clear enough and does it contain enough details (like a URL/page to test and what to do) to test a web page?
            For example, if there is no URL or the instructions are completely blank or nonsensical, it is NOT enough details.
            If it has a URL (or clear local reference) and basic instructions, it IS enough details.
            
            Respond STRICTLY in JSON format with these exact keys:
            {{
                "enough_details": true/false (boolean),
                "reason": "if not enough details, state a clear concise explanation, otherwise empty"
            }}
            """

            messages = [
                {"role": "system", "content": "You are a JSON-only AI responder. Do not include markdown code block formatting in your response. Output pure JSON."},
                {"role": "user", "content": prompt}
            ]

            try:
                # Use OpenAI if API key is present, otherwise fallback to Ollama
                if settings.OPENAI_API_KEY:
                    response_content = await openai_client.chat_completion(messages)
                else:
                    response_content = await ollama_client.chat_completion(messages)

                clean_json = response_content.strip().replace("```json", "").replace("```", "").strip()
                result = json.loads(clean_json)
            except Exception as e:
                logger.error(f"Failed to analyze task {task_id} details with AI: {e}")
                result = {"enough_details": False, "reason": f"AI service failure: {str(e)}"}

            if not result.get("enough_details", False):
                # Move to Task Completed with fail due to lack of details
                reason = result.get("reason", "Not enough details to test")
                new_desc = f"[FAILED: Not enough details to test. Reason: {reason}]\n\n{description}"
                
                try:
                    await api_bridge_service.update_custom_task(task_id, {
                        "status": "Task Completed",
                        "description": new_desc
                    })
                    summary_results["failed_todo"] += 1
                    summary_results["messages"].append(f"Task '{title}' marked COMPLETED with FAILURE: Not enough details")
                except Exception as ex:
                    logger.error(f"Failed to update task {task_id} to COMPLETED: {ex}")
            else:
                # Enough details! Move to Test Case Ready
                try:
                    await api_bridge_service.update_custom_task(task_id, {
                        "status": "Test Case Ready"
                    })
                    summary_results["test_case_ready"] += 1
                    summary_results["messages"].append(f"Task '{title}' has enough details. Moved to TEST CASE READY")
                    logger.info(f"Task '{title}' moved to Test Case Ready")
                except Exception as ex:
                    logger.error(f"Failed to update task {task_id} to Test Case Ready: {ex}")

        # ----------------------------------------------------
        # Phase 2: Process tasks in status 'Test Case Ready' (Write Test Cases & Move to Testing Going)
        # ----------------------------------------------------
        ready_tasks = [t for t in all_custom_tasks if t.get('status', '') == 'Test Case Ready']
        
        for task in ready_tasks:
            task_id = task.get('custom_task_id')
            title = task.get('title')
            description = task.get('description', '')
            
            logger.info(f"Brain Agent generating test cases for Test Case Ready task: {title} ({task_id})")

            # Ask LLM to generate test instructions
            prompt = f"""
            You are an AI QA Engineer.
            We have a validated task that is ready for test case writing:
            Task Title: {title}
            Task Description: {description}
            
            Your job is to generate a comprehensive set of step-by-step test cases/scenarios to test this web page (specifying any target URLs or login steps mentioned in the description).
            
            Respond STRICTLY in JSON format with these exact keys:
            {{
                "test_instructions": "clear step-by-step test instructions and possible scenarios string",
                "url": "the extracted test URL string to open"
            }}
            """

            messages = [
                {"role": "system", "content": "You are a JSON-only AI responder. Do not include markdown code block formatting in your response. Output pure JSON."},
                {"role": "user", "content": prompt}
            ]

            try:
                # Use OpenAI if API key is present, otherwise fallback to Ollama
                if settings.OPENAI_API_KEY:
                    response_content = await openai_client.chat_completion(messages)
                else:
                    response_content = await ollama_client.chat_completion(messages)

                clean_json = response_content.strip().replace("```json", "").replace("```", "").strip()
                result = json.loads(clean_json)
            except Exception as e:
                logger.error(f"Failed to write test cases for task {task_id} with AI: {e}")
                result = {"test_instructions": "Perform standard page verification.", "url": "https://dev.saneforce.com/"}

            test_cases_str = result.get("test_instructions", "Perform standard page verification.")
            extracted_url = result.get("url", "")
            
            try:
                # Update task with test instructions and status = 'Testing Going'
                await api_bridge_service.update_custom_task(task_id, {
                    "status": "Testing Going",
                    "test_instructions": test_cases_str
                })
                summary_results["testing_going"] += 1
                summary_results["messages"].append(f"Task '{title}': written possible test scenarios. Moved to TESTING GOING.")
                logger.info(f"Task '{title}' written test cases and moved to Testing Going")
            except Exception as ex:
                logger.error(f"Failed to move task {task_id} to Testing Going: {ex}")

        # ----------------------------------------------------
        # Phase 3: Process unassigned tasks in status 'Testing Going' (Assign to Online Workers)
        # ----------------------------------------------------
        # Refresh tasks to check current statuses and assignments
        try:
            all_custom_tasks = await api_bridge_service.get_all_custom_tasks()
        except Exception as e:
            logger.error(f"Error refreshing tasks for assignment: {e}")

        testing_tasks = [t for t in all_custom_tasks if t.get('status', '') == 'Testing Going']
        available_workers = [w for w in workers if w.get('status') == 'online']
        
        for task in testing_tasks:
            # Check if task is already assigned to a runner
            if task.get('task_id'):
                continue # Already assigned
                
            title = task.get('title')
            task_id = task.get('custom_task_id')
            description = task.get('description', '')
            test_instructions = task.get('test_instructions', '')
            
            if not available_workers:
                summary_results["messages"].append(f"Task '{title}': waiting for an online agent to become available.")
                logger.info(f"No online agents available to assign task {task_id}")
                continue
                
            # Select first available worker
            assigned_worker = available_workers.pop(0)
            worker_id = assigned_worker.get('worker_id')
            worker_name = assigned_worker.get('nickname')
            
            # Extract URL from description
            extracted_url = "https://dev.saneforce.com/"
            if "http://" in description or "https://" in description:
                urls = re.findall(r'(https?://[^\s]+)', description)
                if urls:
                    extracted_url = urls[0]
            
            try:
                # We create a standard runner task in Node to link to
                timestamp_ms = int(time.time() * 1000)
                clean_numeric_id = task_id.replace('CT-', '')
                run_task_id = f"task-{clean_numeric_id}-{timestamp_ms}"
                
                # Register/create execution task on Node API
                await api_bridge_service.create_task({
                    "task_id": run_task_id,
                    "title": f"Run: {title}",
                    "description": f"AI Directed run for {title}. URL: {extracted_url}",
                    "status": "pending",
                    "workerId": worker_id
                })
                
                # Link custom task to the Node task and save task_id
                await api_bridge_service.update_custom_task(task_id, {
                    "task_id": run_task_id
                })
                
                # Assign and emit to worker!
                await api_bridge_service.emit_task_assign(
                    worker_id=worker_id,
                    task_id=run_task_id,
                    url=extracted_url,
                    prompt=test_instructions
                )
                
                summary_results["messages"].append(f"Task '{title}' assigned to agent '{worker_name}' for live execution.")
                logger.info(f"Task '{title}' successfully assigned to worker {worker_name}")
            except Exception as ex:
                logger.error(f"Failed to assign testing task {task_id}: {ex}")

        # ----------------------------------------------------
        # Phase 4: Process tasks in status 'Testing Going' -> 'Report Generation'
        # ----------------------------------------------------
        # Refresh tasks to check if execution completed
        try:
            all_custom_tasks = await api_bridge_service.get_all_custom_tasks()
        except Exception as e:
            logger.error(f"Error refreshing tasks for report generation check: {e}")

        active_testing_tasks = [t for t in all_custom_tasks if t.get('status', '') == 'Testing Going']
        
        for task in active_testing_tasks:
            task_id = task.get('custom_task_id')
            title = task.get('title')
            node_task_id = task.get('task_id')
            
            if not node_task_id:
                continue
                
            logger.info(f"Checking report availability for task in progress: {title} (Node task ID: {node_task_id})")

            try:
                # Try to fetch the report for this task
                report = await api_bridge_service.get_report_by_task(node_task_id)
                
                if not report or not isinstance(report, dict) or 'report_id' not in report:
                    # Report not generated yet
                    logger.info(f"Report not generated yet for task {node_task_id}")
                    # Check if worker is online, if not mention waiting
                    worker_status = "offline"
                    # Find worker in registry
                    node_task = await api_bridge_service.get_task_status(node_task_id)
                    assigned_worker_id = node_task.get("workerId") if node_task else None
                    if assigned_worker_id:
                        for w in workers:
                            if w.get("worker_id") == assigned_worker_id:
                                worker_status = w.get("status", "online")
                                break
                    if worker_status != "online":
                        summary_results["messages"].append(f"Task '{title}' is in TESTING GOING but the assigned agent went offline. Waiting for agent.")
                    continue
                    
                report_id = report.get('report_id')
                
                # Move status to 'Report Generation'
                await api_bridge_service.update_custom_task(task_id, {
                    "status": "Report Generation",
                    "report_id": report_id,
                    "report_generated": True
                })
                summary_results["report_generation"] += 1
                summary_results["messages"].append(f"Task '{title}' has finished execution. Moved to REPORT GENERATION.")
                
            except Exception as e:
                logger.error(f"Error checking report for task {node_task_id}: {e}")

        # ----------------------------------------------------
        # Phase 5: Process tasks in status 'Report Generation' -> 'Task Completed'
        # ----------------------------------------------------
        # Refresh tasks to check report analysis
        try:
            all_custom_tasks = await api_bridge_service.get_all_custom_tasks()
        except Exception as e:
            logger.error(f"Error refreshing tasks for evaluation: {e}")

        report_tasks = [t for t in all_custom_tasks if t.get('status', '') == 'Report Generation']
        
        for task in report_tasks:
            task_id = task.get('custom_task_id')
            title = task.get('title')
            description = task.get('description', '')
            node_task_id = task.get('task_id')
            report_id = task.get('report_id')
            
            if not node_task_id or not report_id:
                continue
                
            logger.info(f"AI evaluating report for: {title} (Report ID: {report_id})")

            try:
                report = await api_bridge_service.get_report_by_task(node_task_id)
                if not report:
                    continue
                    
                success_rate = report.get('success_rate', 100)
                error_summary = report.get('error_summary', '')
                
                # Ask LLM to check report
                report_prompt = f"""
                You are an AI Brain QA Director.
                We have a custom local task that has finished execution on a worker agent.
                Task Title: {title}
                Task Description: {description}
                
                Test Report details:
                - Success Rate: {success_rate}%
                - Error Summary: {error_summary}
                - Report Metadata: {json.dumps(report.get('metadata', {{}}))}
                
                Determine:
                1. Did the test complete successfully with all expected outcomes correct (e.g. success rate is high and no major critical blocks), or were there failures/issues?
                2. Write a concise final status summary. If there is a failure, mention the exact issue/failure.
                
                Respond STRICTLY in JSON format with these exact keys:
                {{
                    "success": true/false (boolean),
                    "summary": "concise final summary of the execution outcome and findings"
                }}
                """

                messages = [
                    {"role": "system", "content": "You are a JSON-only AI responder. Do not include markdown code block formatting in your response. Output pure JSON."},
                    {"role": "user", "content": report_prompt}
                ]

                if settings.OPENAI_API_KEY:
                    report_response = await openai_client.chat_completion(messages)
                else:
                    report_response = await ollama_client.chat_completion(messages)

                clean_report_json = report_response.strip().replace("```json", "").replace("```", "").strip()
                report_result = json.loads(clean_report_json)
                
                is_success = report_result.get("success", True)
                summary_text = report_result.get("summary", "Test verified.")
                
                if is_success:
                    final_desc = f"[SUCCESS: {summary_text}]\n\n{description}"
                    await api_bridge_service.update_custom_task(task_id, {
                        "status": "Task Completed",
                        "description": final_desc
                    })
                    summary_results["completed_success"] += 1
                    summary_results["messages"].append(f"Task '{title}' marked COMPLETED with SUCCESS!")
                else:
                    final_desc = f"[FAILED: {summary_text}]\n\n{description}"
                    await api_bridge_service.update_custom_task(task_id, {
                        "status": "Task Completed",
                        "description": final_desc
                    })
                    summary_results["completed_failed"] += 1
                    summary_results["messages"].append(f"Task '{title}' marked COMPLETED with FAILURE: {summary_text}")
                    
            except Exception as e:
                logger.error(f"Error evaluating report for custom task {task_id}: {e}")

        return summary_results

ai_orchestrator = AIOrchestratorService()