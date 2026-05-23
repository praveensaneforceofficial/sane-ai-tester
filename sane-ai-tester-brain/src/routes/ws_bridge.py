from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any
import json
from services.aiOrchestratorService import ai_orchestrator
from utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

@router.websocket("/ws/node-bridge")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("🔌 Node.js API client connected to Brain WebSocket Bridge")
    try:
        while True:
            # Await incoming message
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except Exception as e:
                logger.error(f"Failed to parse incoming WebSocket JSON: {e}")
                await websocket.send_json({
                    "type": "error",
                    "error": "Invalid JSON format"
                })
                continue

            job_id = msg.get("job_id")
            msg_type = msg.get("type")

            if not msg_type:
                logger.warn("Received message without 'type'")
                await websocket.send_json({
                    "job_id": job_id,
                    "type": "error",
                    "error": "Missing message 'type'"
                })
                continue

            logger.info(f"🧠 Brain WS Bridge received job: {msg_type} (Job ID: {job_id})")

            try:
                if msg_type == "orchestrate":
                    # Full AI orchestration
                    result = await ai_orchestrator.run_brain_agent_orchestration()
                    await websocket.send_json({
                        "job_id": job_id,
                        "type": "result",
                        "data": result
                    })

                elif msg_type == "check-ai":
                    # Check AI status
                    result = await ai_orchestrator.check_ai_availability()
                    await websocket.send_json({
                        "job_id": job_id,
                        "type": "result",
                        "data": result
                    })

                elif msg_type == "generate-prompt":
                    # Generate test prompt
                    url = msg.get("url")
                    if not url:
                        raise ValueError("url is required for generate-prompt")
                    prompt = await ai_orchestrator.generate_test_prompt(url)
                    await websocket.send_json({
                        "job_id": job_id,
                        "type": "result",
                        "data": {"prompt": prompt}
                    })

                else:
                    logger.warn(f"Unknown message type: {msg_type}")
                    await websocket.send_json({
                        "job_id": job_id,
                        "type": "error",
                        "error": f"Unknown message type: {msg_type}"
                    })

            except Exception as e:
                logger.error(f"Error executing job {msg_type} ({job_id}): {e}", exc_info=True)
                await websocket.send_json({
                    "job_id": job_id,
                    "type": "error",
                    "error": str(e)
                })

    except WebSocketDisconnect:
        logger.info("🔌 Node.js API client disconnected from Brain WebSocket Bridge")
    except Exception as e:
        logger.error(f"WebSocket bridge error: {e}", exc_info=True)
