"""
Orchestrator agent for StackAdvisor tech stack evaluation.

Uses the AWS Bedrock Converse API (via boto3) to run a multi-turn conversation
with the orchestrator system prompt, dispatching tool calls to TOOL_HANDLERS
and handling the human-in-the-loop approval gate via WebSocket.
"""

import asyncio
import json
import logging
from typing import Any

import boto3

from app.config import settings
from app.agent.prompts import ORCHESTRATOR_SYSTEM_PROMPT
from app.agent.tools import TOOL_DEFINITIONS_BEDROCK, TOOL_HANDLERS
from app.models.schemas import ProjectRequirements, ApprovalResponse

logger = logging.getLogger(__name__)


class EvaluationOrchestrator:
    """Orchestrates a tech stack evaluation session.

    Manages a multi-turn conversation with the Bedrock Converse API, dispatches
    tool calls to registered handlers, and coordinates human-in-the-loop
    approval via WebSocket messages.

    Args:
        session_id: Unique identifier for the evaluation session.
        ws_send_callback: Async callable that sends a JSON-serialisable dict
            to the connected WebSocket client.
    """

    def __init__(self, session_id: str, ws_send_callback: Any) -> None:
        self.session_id = session_id
        self.ws_send = ws_send_callback
        self.client = boto3.client(
            "bedrock-runtime", region_name=settings.AWS_REGION
        )
        self.model_id = settings.BEDROCK_MODEL_ID
        self.conversation_history: list[dict[str, Any]] = []
        self.approval_event = asyncio.Event()
        self.approval_response: ApprovalResponse | None = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def evaluate(self, requirements: ProjectRequirements) -> None:
        """Start a new evaluation for the given project requirements."""
        prompt = (
            "Evaluate the tech stack for this project:\n\n"
            f"{requirements.model_dump_json(indent=2)}"
        )
        await self._run_conversation(prompt)

    async def handle_chat(self, user_message: str) -> None:
        """Handle a follow-up chat message from the user."""
        await self._run_conversation(user_message)

    async def handle_approval_response(self, response: ApprovalResponse) -> None:
        """Unblock the orchestrator after the user responds to an approval request."""
        self.approval_response = response
        self.approval_event.set()

    # ------------------------------------------------------------------
    # Internal conversation loop
    # ------------------------------------------------------------------

    async def _run_conversation(self, user_message: str) -> None:
        """Drive the multi-turn orchestrator loop.

        Appends the user message, calls the Bedrock Converse API, processes
        assistant content blocks (text + toolUse), executes tools, feeds
        results back, and repeats until the model stops requesting tools.
        """
        self.conversation_history.append({
            "role": "user",
            "content": [{"text": user_message}],
        })

        while True:
            try:
                response = await asyncio.to_thread(
                    self.client.converse,
                    modelId=self.model_id,
                    system=[{"text": ORCHESTRATOR_SYSTEM_PROMPT}],
                    messages=self.conversation_history,
                    toolConfig={"tools": TOOL_DEFINITIONS_BEDROCK},
                    inferenceConfig={"maxTokens": 4096},
                )
            except Exception as exc:
                logger.error("Bedrock API error: %s", exc)
                await self.ws_send({
                    "type": "error",
                    "payload": {"message": f"API error: {exc}"},
                    "session_id": self.session_id,
                })
                return

            # Append the assistant turn to history
            assistant_message = response["output"]["message"]
            self.conversation_history.append(assistant_message)

            # Stream text blocks and progress updates to the frontend
            for block in assistant_message["content"]:
                if "text" in block:
                    await self.ws_send({
                        "type": "agent_message",
                        "payload": {"message": block["text"]},
                        "session_id": self.session_id,
                    })
                elif "toolUse" in block:
                    tool_name = block["toolUse"]["name"]
                    await self.ws_send({
                        "type": "progress_update",
                        "payload": {
                            "tool": tool_name,
                            "message": f"Using tool: {tool_name}",
                        },
                        "session_id": self.session_id,
                    })

            # If the model wants to use tools, execute them and loop back
            stop_reason = response.get("stopReason", "end_turn")
            if stop_reason == "tool_use":
                tool_results = await self._process_tool_calls(
                    assistant_message["content"]
                )
                self.conversation_history.append({
                    "role": "user",
                    "content": tool_results,
                })
            else:
                # end_turn or max_tokens — conversation turn is complete
                await self.ws_send({
                    "type": "evaluation_complete",
                    "payload": {"message": "Evaluation turn complete."},
                    "session_id": self.session_id,
                })
                break

    # ------------------------------------------------------------------
    # Tool execution helpers
    # ------------------------------------------------------------------

    async def _process_tool_calls(
        self, content_blocks: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        """Execute every toolUse block and return toolResult messages."""
        results: list[dict[str, Any]] = []
        for block in content_blocks:
            if "toolUse" not in block:
                continue
            tool_use = block["toolUse"]
            result = await self._execute_tool(tool_use["name"], tool_use["input"])
            content_str = (
                json.dumps(result) if isinstance(result, dict) else str(result)
            )
            results.append({
                "toolResult": {
                    "toolUseId": tool_use["toolUseId"],
                    "content": [{"text": content_str}],
                }
            })
        return results

    async def _execute_tool(
        self, tool_name: str, tool_input: dict[str, Any]
    ) -> dict[str, Any]:
        """Execute a single tool by name.

        The ``request_user_approval`` tool is handled specially: it pushes an
        approval request over the WebSocket and then waits asynchronously for
        the user to respond.
        """
        if tool_name == "request_user_approval":
            return await self._handle_approval_tool(tool_input)

        handler = TOOL_HANDLERS.get(tool_name)
        if handler is not None:
            try:
                return await handler(**tool_input)
            except Exception as exc:
                logger.exception("Tool %s raised an exception", tool_name)
                return {"error": str(exc)}

        logger.warning("Unknown tool requested: %s", tool_name)
        return {"error": f"Unknown tool: {tool_name}"}

    async def _handle_approval_tool(
        self, tool_input: dict[str, Any]
    ) -> dict[str, Any]:
        """Send an approval request to the frontend and block until answered."""
        await self.ws_send({
            "type": "approval_request",
            "payload": tool_input,
            "session_id": self.session_id,
        })

        # Reset and wait for the frontend to call handle_approval_response()
        self.approval_event.clear()
        await self.approval_event.wait()

        response = self.approval_response
        if response is None:
            return {"decision": "reject", "feedback": "No response received."}

        return {
            "decision": response.decision,
            "feedback": response.feedback or "",
        }
