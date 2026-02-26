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
    with patch("app.agent.orchestrator.anthropic.AsyncAnthropic"):
        orch = EvaluationOrchestrator(
            session_id="test-session",
            ws_send_callback=ws_send,
        )
    return orch


def test_orchestrator_init(orchestrator, ws_send):
    assert orchestrator.session_id == "test-session"
    assert orchestrator.ws_send is ws_send
    assert orchestrator.conversation_history == []


def test_serialise_content_text():
    text_block = MagicMock()
    text_block.type = "text"
    text_block.text = "Hello world"

    result = EvaluationOrchestrator._serialise_content([text_block])
    assert result == [{"type": "text", "text": "Hello world"}]


def test_serialise_content_tool_use():
    tool_block = MagicMock()
    tool_block.type = "tool_use"
    tool_block.id = "tool-123"
    tool_block.name = "search_tech_benchmarks"
    tool_block.input = {"technology": "React"}

    result = EvaluationOrchestrator._serialise_content([tool_block])
    assert result == [{
        "type": "tool_use",
        "id": "tool-123",
        "name": "search_tech_benchmarks",
        "input": {"technology": "React"},
    }]


def test_serialise_content_mixed():
    text_block = MagicMock()
    text_block.type = "text"
    text_block.text = "Analyzing..."

    tool_block = MagicMock()
    tool_block.type = "tool_use"
    tool_block.id = "t1"
    tool_block.name = "get_github_stats"
    tool_block.input = {"repo_owner": "fb", "repo_name": "react"}

    result = EvaluationOrchestrator._serialise_content([text_block, tool_block])
    assert len(result) == 2
    assert result[0]["type"] == "text"
    assert result[1]["type"] == "tool_use"


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

    # Simulate: start waiting for approval, then respond
    async def respond_later():
        await asyncio.sleep(0.05)
        await orchestrator.handle_approval_response(response)

    asyncio.create_task(respond_later())

    # _handle_approval_tool sends WS message then waits for event
    result = await orchestrator._handle_approval_tool({
        "title": "Test",
        "description": "Test approval",
        "recommendation": {},
    })

    assert result["decision"] == "approve"
    assert ws_send.called  # Should have sent approval_request


@pytest.mark.asyncio
async def test_run_conversation_api_error(orchestrator, ws_send):
    """Test that API errors are sent via WebSocket."""
    import anthropic
    orchestrator.client.messages.create = AsyncMock(
        side_effect=anthropic.APIError(
            message="rate limited",
            request=MagicMock(),
            body=None,
        )
    )
    await orchestrator._run_conversation("test message")

    # Should have sent error via WS
    error_calls = [
        call for call in ws_send.call_args_list
        if call[0][0].get("type") == "error"
    ]
    assert len(error_calls) == 1
