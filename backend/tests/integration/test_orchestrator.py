"""Integration tests for EvaluationOrchestrator."""

import asyncio
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.agent.orchestrator import EvaluationOrchestrator
from app.models.schemas import ApprovalResponse


@pytest.fixture
def ws_send():
    return AsyncMock()


@pytest.fixture
def orchestrator(ws_send):
    with patch("app.agent.orchestrator.boto3.client") as mock_client:
        orch = EvaluationOrchestrator(
            session_id="test-session",
            ws_send_callback=ws_send,
        )
    return orch


def test_orchestrator_init(orchestrator, ws_send):
    assert orchestrator.session_id == "test-session"
    assert orchestrator.ws_send is ws_send
    assert orchestrator.conversation_history == []


@pytest.mark.asyncio
async def test_execute_tool_known(orchestrator):
    result = await orchestrator._execute_tool(
        "search_tech_benchmarks", {"technology": "Go"}
    )
    assert result["technology"] == "Go"


@pytest.mark.asyncio
async def test_execute_tool_unknown(orchestrator):
    result = await orchestrator._execute_tool("nonexistent", {})
    assert "error" in result
    assert "Unknown tool" in result["error"]


@pytest.mark.asyncio
async def test_execute_tool_exception(orchestrator):
    with patch("app.agent.orchestrator.TOOL_HANDLERS", {"bad_tool": AsyncMock(side_effect=RuntimeError("boom"))}):
        result = await orchestrator._execute_tool("bad_tool", {})
    assert "error" in result
    assert "boom" in result["error"]


@pytest.mark.asyncio
async def test_approval_flow(orchestrator, ws_send):
    """Test that handle_approval_response unblocks the approval event."""
    response = ApprovalResponse(request_id="r1", decision="approve")

    async def respond_later():
        await asyncio.sleep(0.05)
        await orchestrator.handle_approval_response(response)

    asyncio.create_task(respond_later())

    result = await orchestrator._handle_approval_tool({
        "title": "Test",
        "description": "Test approval",
        "recommendation": {},
    })

    assert result["decision"] == "approve"
    assert ws_send.called


@pytest.mark.asyncio
async def test_run_conversation_api_error(orchestrator, ws_send):
    """Test that API errors are sent via WebSocket."""
    orchestrator.client.converse = MagicMock(
        side_effect=Exception("rate limited")
    )
    await orchestrator._run_conversation("test message")

    error_calls = [
        call for call in ws_send.call_args_list
        if call[0][0].get("type") == "error"
    ]
    assert len(error_calls) == 1


@pytest.mark.asyncio
async def test_process_tool_calls(orchestrator):
    """Test tool call processing with Bedrock content format."""
    content_blocks = [
        {"text": "Let me look that up."},
        {
            "toolUse": {
                "toolUseId": "tool-123",
                "name": "search_tech_benchmarks",
                "input": {"technology": "React"},
            }
        },
    ]
    results = await orchestrator._process_tool_calls(content_blocks)
    assert len(results) == 1
    assert "toolResult" in results[0]
    assert results[0]["toolResult"]["toolUseId"] == "tool-123"


@pytest.mark.asyncio
async def test_run_conversation_end_turn(orchestrator, ws_send):
    """Test a simple conversation that ends without tool use."""
    orchestrator.client.converse = MagicMock(
        return_value={
            "output": {
                "message": {
                    "role": "assistant",
                    "content": [{"text": "Hello!"}],
                }
            },
            "stopReason": "end_turn",
        }
    )

    await orchestrator._run_conversation("Hi")

    message_types = [call[0][0]["type"] for call in ws_send.call_args_list]
    assert "agent_message" in message_types
    assert "evaluation_complete" in message_types
