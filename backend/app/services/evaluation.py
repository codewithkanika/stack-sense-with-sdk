"""
Thin evaluation service wrapper.

Provides a convenience layer over the EvaluationOrchestrator for use by
the WebSocket handler. Keeps the WebSocket module focused on protocol
handling while this module owns the relationship between sessions and
orchestrators.
"""

import logging
from typing import Any

from app.agent.orchestrator import EvaluationOrchestrator
from app.models.schemas import ProjectRequirements, ApprovalResponse
from app.models.session import session_store

logger = logging.getLogger(__name__)


class EvaluationService:
    """Manages orchestrator instances for active WebSocket sessions."""

    def __init__(self, session_id: str, ws_send_callback: Any) -> None:
        self.session_id = session_id
        self.orchestrator = EvaluationOrchestrator(
            session_id=session_id,
            ws_send_callback=ws_send_callback,
        )

    async def start_evaluation(self, requirements: ProjectRequirements) -> None:
        """Kick off the evaluation, updating session status."""
        session_store.update(self.session_id, status="evaluating")
        try:
            await self.orchestrator.evaluate(requirements)
        except Exception:
            logger.exception(
                "Evaluation failed for session %s", self.session_id
            )
            session_store.update(self.session_id, status="error")

    async def handle_chat(self, message: str) -> None:
        """Forward a follow-up chat message to the orchestrator."""
        await self.orchestrator.handle_chat(message)

    async def handle_approval(self, response: ApprovalResponse) -> None:
        """Forward an approval response to the orchestrator."""
        await self.orchestrator.handle_approval_response(response)
