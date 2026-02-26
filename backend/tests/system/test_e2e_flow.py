"""
System / end-to-end tests for the full StackAdvisor evaluation flow.

These tests exercise the real API surface using Starlette's TestClient:
    1. Create a session via POST /api/sessions
    2. Connect to the WebSocket at /ws/{session_id}
    3. Send a ``start_evaluation`` message with sample ProjectRequirements
    4. Assert that agent messages and progress updates are received

Because the tests call the live Anthropic API they are **skipped by default**
unless the ``ANTHROPIC_API_KEY`` environment variable is set.

Run manually with:
    ANTHROPIC_API_KEY=sk-... pytest -m system backend/tests/system/
"""

import os

import pytest
from starlette.testclient import TestClient

from app.main import app
from app.models.session import session_store

pytestmark = pytest.mark.system

SAMPLE_REQUIREMENTS = {
    "project_description": "A simple REST API for a to-do list application",
    "project_type": "api_service",
    "expected_users": "< 1K",
    "budget": "bootstrap",
    "team_size": 2,
    "team_experience": "mid",
    "language_preferences": ["python", "typescript"],
    "compliance_needs": [],
    "timeline": "1_month",
    "priorities": {
        "scalability": 5,
        "cost": 8,
        "dx": 9,
        "performance": 6,
        "security": 5,
    },
}


@pytest.fixture(autouse=True)
def clear_sessions():
    """Ensure a clean session store for each test."""
    session_store._sessions.clear()
    yield
    session_store._sessions.clear()


# ---------------------------------------------------------------------------
# Session CRUD tests (no API key needed -- these hit only REST endpoints)
# ---------------------------------------------------------------------------


def test_session_creation_and_retrieval():
    """Smoke test: create a session and retrieve it via GET."""
    client = TestClient(app)

    # Create
    resp = client.post("/api/sessions")
    assert resp.status_code == 200
    session_id = resp.json()["session_id"]
    assert session_id, "Session ID must not be empty"

    # Retrieve
    resp = client.get(f"/api/sessions/{session_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["session_id"] == session_id

    # Non-existent session returns 404
    resp = client.get("/api/sessions/does-not-exist")
    assert resp.status_code == 404


def test_health_check():
    """The /health endpoint should return 200."""
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# WebSocket tests
# ---------------------------------------------------------------------------


def test_websocket_unknown_message_type():
    """Sending an unknown message type should return an error frame."""
    client = TestClient(app)

    resp = client.post("/api/sessions")
    session_id = resp.json()["session_id"]

    with client.websocket_connect(f"/ws/{session_id}") as ws:
        ws.send_json({
            "type": "totally_invalid_type",
            "payload": {},
        })

        data = ws.receive_json()
        assert data["type"] == "error"
        assert "Unknown message type" in data["payload"]["message"]


# ---------------------------------------------------------------------------
# Full evaluation flow (requires ANTHROPIC_API_KEY)
# ---------------------------------------------------------------------------


@pytest.mark.skipif(
    not os.environ.get("ANTHROPIC_API_KEY"),
    reason="ANTHROPIC_API_KEY not set",
)
def test_full_evaluation_flow():
    """End-to-end: create session, connect WS, start evaluation, receive messages.

    This test requires a running Anthropic API connection and may take up to
    two minutes depending on model response time.
    """
    client = TestClient(app)

    # 1. Create session via REST
    resp = client.post("/api/sessions")
    assert resp.status_code == 200
    session_id = resp.json()["session_id"]

    # 2. Connect WebSocket and start evaluation
    with client.websocket_connect(f"/ws/{session_id}") as ws:
        ws.send_json({
            "type": "start_evaluation",
            "payload": SAMPLE_REQUIREMENTS,
        })

        # 3. Collect messages until evaluation_complete or we hit a reasonable cap
        messages: list[dict] = []
        for _ in range(50):  # safety cap to avoid infinite loops
            try:
                data = ws.receive_json(timeout=30)
                messages.append(data)
                if data.get("type") == "evaluation_complete":
                    break
            except Exception:
                break

        # 4. Assertions
        assert len(messages) > 0, "Should have received at least one message"

        msg_types = [m.get("type") for m in messages]

        has_progress = "progress_update" in msg_types
        has_agent_msg = "agent_message" in msg_types
        has_complete = "evaluation_complete" in msg_types

        assert has_progress or has_agent_msg, (
            f"Expected progress_update or agent_message, got: {msg_types}"
        )
        assert has_complete, (
            f"Expected evaluation_complete in message types: {msg_types}"
        )


@pytest.mark.skipif(
    not os.environ.get("ANTHROPIC_API_KEY"),
    reason="ANTHROPIC_API_KEY not set",
)
def test_chat_message_flow():
    """Send a user_message over WebSocket and expect an agent reply."""
    client = TestClient(app)

    resp = client.post("/api/sessions")
    session_id = resp.json()["session_id"]

    with client.websocket_connect(f"/ws/{session_id}") as ws:
        ws.send_json({
            "type": "user_message",
            "payload": {"message": "What is the best database for a small startup?"},
        })

        # Expect at least one agent_message back
        messages: list[dict] = []
        for _ in range(20):
            try:
                data = ws.receive_json(timeout=30)
                messages.append(data)
                if data.get("type") == "agent_message":
                    break
            except Exception:
                break

        msg_types = [m.get("type") for m in messages]
        assert "agent_message" in msg_types, (
            f"Expected an agent_message reply, got: {msg_types}"
        )
