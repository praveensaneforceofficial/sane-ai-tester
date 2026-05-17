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

    async def run_brain_agent_orchestration(self) -> Dict[str, Any]:
        """Orchestrate custom tasks pipeline from TODO through Testing to Completion"""
        import json
        import time
        from services.apiBridgeService import api_bridge_service

        logger.info("Starting Brain Agent Orchestration...")
        summary_results = {
            "processed_todo": 0,
            "failed_todo": 0,
            "test_case_ready": 0,
            "testing_going": 0,
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
        # Phase 1: Process TODO tasks
        # ----------------------------------------------------
        todo_tasks = [t for t in all_custom_tasks if t.get('status', '').lower() in ('todo', 'pending')]
        
        agents_desc = []
        for w in workers:
            agents_desc.append(f"- Nickname: {w.get('nickname')}, ID: {w.get('worker_id')}, Type: {w.get('worker_type')}, Status: {w.get('status')}")
        agents_str = "\n".join(agents_desc) if agents_desc else "No online agents"

        for task in todo_tasks:
            summary_results["processed_todo"] += 1
            task_id = task.get('custom_task_id')
            title = task.get('title')
            description = task.get('description', '')
            priority = task.get('priority', 'medium')
            
            logger.info(f"Brain Agent processing TODO task: {title} ({task_id})")

            # Ask LLM if the task is testable given online agents, extract testing URL and write instructions
            prompt = f"""
            You are an AI Brain QA Director.
            We have a manual local task that we want to test:
            Task Title: {title}
            Task Description: {description}
            Task Priority: {priority}
            
            Currently online worker agents:
            {agents_str}
            
            Your job is to determine:
            1. Is this task able to be tested? (For example: if it requires mobile platforms but only Web agents are online, or if the description is completely invalid, it is NOT testable. If it's a standard web URL/page test and we have online Web agents, it IS testable.)
            2. If NOT testable, state the clear, concise failure reason (e.g., "Mobile can't test because no mobile agents are online" or "Invalid instructions").
            3. If YES (testable):
               - Extract the URL to test from the description.
               - Generate a step-by-step Test Case / Test Instructions for testing this web page (specifically target the URL or instruction details in the description).
            
            Respond STRICTLY in JSON format with these exact keys:
            {{
                "testable": true/false (boolean),
                "url": "extracted test URL string if testable, otherwise empty",
                "reason": "failure reason string if not testable, otherwise empty",
                "test_cases": "concise step-by-step test instructions string if testable, otherwise empty"
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
                logger.error(f"Failed to analyze task {task_id} with AI: {e}")
                result = {"testable": False, "url": "", "reason": f"AI service failure: {str(e)}", "test_cases": ""}

            if not result.get("testable", False):
                # Move to Task Completed with fail due to reason
                reason = result.get("reason", "Not testable by current agents")
                new_desc = f"[FAILED: {reason}]\n\n{description}"
                
                try:
                    await api_bridge_service.update_custom_task(task_id, {
                        "status": "Task Completed",
                        "description": new_desc
                    })
                    summary_results["failed_todo"] += 1
                    summary_results["messages"].append(f"Task '{title}' marked COMPLETED with FAILURE: {reason}")
                except Exception as ex:
                    logger.error(f"Failed to update task {task_id} to COMPLETED: {ex}")
            else:
                # Testable! Write test case and move to Test Case Ready
                test_cases_str = result.get("test_cases", "Perform full verification.")
                extracted_url = result.get("url", "")
                
                try:
                    # Update task with test instructions and status = 'Test Case Ready'
                    await api_bridge_service.update_custom_task(task_id, {
                        "status": "Test Case Ready",
                        "test_instructions": test_cases_str
                    })
                    summary_results["test_case_ready"] += 1
                    logger.info(f"Task '{title}' moved to Test Case Ready")

                    # Check available agent
                    available_workers = [w for w in workers if w.get('status') == 'online']
                    if available_workers:
                        # Select first available worker
                        assigned_worker = available_workers[0]
                        worker_id = assigned_worker.get('worker_id')
                        worker_name = assigned_worker.get('nickname')

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
                        
                        # Link custom task to the Node task and update status to Testing Going
                        await api_bridge_service.update_custom_task(task_id, {
                            "status": "Testing Going",
                            "task_id": run_task_id
                        })
                        
                        # Assign and emit to worker!
                        await api_bridge_service.emit_task_assign(
                            worker_id=worker_id,
                            task_id=run_task_id,
                            url=extracted_url or "https://dev.saneforce.com/",
                            prompt=test_cases_str
                        )
                        
                        summary_results["testing_going"] += 1
                        summary_results["messages"].append(f"Task '{title}' assigned to agent '{worker_name}' under status TESTING GOING")
                    else:
                        summary_results["messages"].append(f"Task '{title}' moved to TEST CASE READY but no online idle agents available to execute")
                except Exception as ex:
                    logger.error(f"Failed to execute test assignment workflow for task {task_id}: {ex}")

        # ----------------------------------------------------
        # Phase 2: Process tasks in status 'Testing Going'
        # ----------------------------------------------------
        testing_tasks = [t for t in all_custom_tasks if t.get('status', '') == 'Testing Going']
        
        for task in testing_tasks:
            task_id = task.get('custom_task_id')
            title = task.get('title')
            description = task.get('description', '')
            node_task_id = task.get('task_id')
            
            if not node_task_id:
                continue
                
            logger.info(f"Checking report for task in progress: {title} (Node task ID: {node_task_id})")

            try:
                # Try to fetch the report for this task
                report = await api_bridge_service.get_report_by_task(node_task_id)
                
                if not report or not isinstance(report, dict) or 'report_id' not in report:
                    # Report not generated yet
                    logger.info(f"Report not generated yet for task {node_task_id}")
                    continue
                    
                report_id = report.get('report_id')
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
                        "description": final_desc,
                        "report_generated": True,
                        "report_id": report_id
                    })
                    summary_results["completed_success"] += 1
                    summary_results["messages"].append(f"Task '{title}' marked COMPLETED with SUCCESS!")
                else:
                    final_desc = f"[FAILED: {summary_text}]\n\n{description}"
                    await api_bridge_service.update_custom_task(task_id, {
                        "status": "Task Completed",
                        "description": final_desc,
                        "report_generated": True,
                        "report_id": report_id
                    })
                    summary_results["completed_failed"] += 1
                    summary_results["messages"].append(f"Task '{title}' marked COMPLETED with FAILURE: {summary_text}")
                    
            except Exception as e:
                logger.error(f"Error checking report for task {node_task_id}: {e}")

        return summary_results

ai_orchestrator = AIOrchestratorService()