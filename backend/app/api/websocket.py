import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    logger.info(f"WebSocket connected: session={session_id}")

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            payload = data.get("payload", {})

            match msg_type:
                case "user_message":
                    # Placeholder — will be wired to orchestrator later
                    await websocket.send_json({
                        "type": "agent_message",
                        "payload": {"message": f"Echo: {payload.get('message', '')}"},
                        "session_id": session_id,
                    })
                case "start_evaluation":
                    await websocket.send_json({
                        "type": "progress_update",
                        "payload": {"phase": "starting", "message": "Evaluation starting..."},
                        "session_id": session_id,
                    })
                case "approval_response":
                    await websocket.send_json({
                        "type": "agent_message",
                        "payload": {"message": f"Approval received: {payload.get('decision', '')}"},
                        "session_id": session_id,
                    })
                case "scenario_query":
                    await websocket.send_json({
                        "type": "agent_message",
                        "payload": {"message": f"Scenario analysis placeholder: {payload.get('query', '')}"},
                        "session_id": session_id,
                    })
                case _:
                    await websocket.send_json({
                        "type": "error",
                        "payload": {"message": f"Unknown message type: {msg_type}"},
                        "session_id": session_id,
                    })
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: session={session_id}")
