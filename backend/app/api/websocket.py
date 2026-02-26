"""
WebSocket endpoint for real-time communication between the frontend and
the StackAdvisor orchestrator agent.

Message types (client -> server):
    - user_message:       Free-form chat message from the user
    - start_evaluation:   Begin a tech stack evaluation with project requirements
    - approval_response:  User approves/rejects/modifies a recommendation
    - scenario_query:     "What if" scenario analysis request

Message types (server -> client):
    - agent_message:      Text output from the orchestrator
    - progress_update:    Tool usage / phase progress notification
    - approval_request:   Human-in-the-loop approval gate
    - evaluation_complete: Signals that the current evaluation turn finished
    - error:              Error notification
"""

import asyncio
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.agent.orchestrator import EvaluationOrchestrator
from app.models.schemas import ProjectRequirements, ApprovalResponse
from app.models.session import session_store

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str) -> None:
    await websocket.accept()
    logger.info("WebSocket connected: session=%s", session_id)

    # ---- callback the orchestrator will use to push messages ----
    async def ws_send(msg: dict) -> None:
        await websocket.send_json(msg)

    orchestrator = EvaluationOrchestrator(
        session_id=session_id,
        ws_send_callback=ws_send,
    )

    # Keep track of background tasks so we can cancel them on disconnect
    background_tasks: set[asyncio.Task] = set()  # type: ignore[type-arg]

    def _launch(coro) -> None:  # type: ignore[no-untyped-def]
        """Fire-and-forget an orchestrator coroutine, tracking the task."""
        task = asyncio.create_task(_safe_run(coro))
        background_tasks.add(task)
        task.add_done_callback(background_tasks.discard)

    async def _safe_run(coro) -> None:  # type: ignore[no-untyped-def]
        """Run a coroutine and log exceptions instead of crashing."""
        try:
            await coro
        except Exception:
            logger.exception("Background task failed for session=%s", session_id)
            try:
                await websocket.send_json({
                    "type": "error",
                    "payload": {"message": "An internal error occurred during processing."},
                    "session_id": session_id,
                })
            except Exception:
                pass  # WebSocket may already be closed

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            payload = data.get("payload", {})

            match msg_type:
                case "user_message":
                    message = payload.get("message", "")
                    _launch(orchestrator.handle_chat(message))

                case "start_evaluation":
                    requirements = ProjectRequirements(**payload)
                    session_store.update(session_id, status="evaluating")
                    _launch(orchestrator.evaluate(requirements))

                case "approval_response":
                    response = ApprovalResponse(**payload)
                    await orchestrator.handle_approval_response(response)

                case "scenario_query":
                    query = payload.get("query", "")
                    _launch(
                        orchestrator.handle_chat(f"SCENARIO ANALYSIS: {query}")
                    )

                case _:
                    await websocket.send_json({
                        "type": "error",
                        "payload": {"message": f"Unknown message type: {msg_type}"},
                        "session_id": session_id,
                    })

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected: session=%s", session_id)
    finally:
        # Cancel any still-running background tasks on disconnect
        for task in background_tasks:
            task.cancel()
