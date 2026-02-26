"""Integration tests for WebSocket endpoint."""

import pytest
from starlette.testclient import TestClient

from app.main import app
from app.models.session import session_store


@pytest.fixture(autouse=True)
def clear_sessions():
    session_store._sessions.clear()
    yield
    session_store._sessions.clear()


def test_websocket_connect_and_unknown_message():
    """Test WebSocket connection and unknown message type handling."""
    client = TestClient(app)
    session_store.create()
    sid = list(session_store._sessions.keys())[0]

    with client.websocket_connect(f"/ws/{sid}") as ws:
        ws.send_json({"type": "unknown_type", "payload": {}})
        data = ws.receive_json()
        assert data["type"] == "error"
        assert "Unknown message type" in data["payload"]["message"]


def test_websocket_connect_disconnect():
    """Test basic connect/disconnect lifecycle."""
    client = TestClient(app)
    sid = session_store.create()

    with client.websocket_connect(f"/ws/{sid}") as ws:
        # Just connecting and disconnecting should work
        ws.send_json({"type": "unknown_type", "payload": {}})
        data = ws.receive_json()
        assert data["type"] == "error"
