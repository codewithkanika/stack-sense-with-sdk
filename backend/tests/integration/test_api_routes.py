"""Integration tests for REST API routes."""

import pytest
import httpx

from app.main import app
from app.models.session import session_store


@pytest.fixture(autouse=True)
def clear_sessions():
    """Clear session store before each test."""
    session_store._sessions.clear()
    yield
    session_store._sessions.clear()


@pytest.fixture
def client():
    return httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://test",
    )


@pytest.mark.asyncio
async def test_health_check(client):
    async with client as c:
        resp = await c.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_create_session(client):
    async with client as c:
        resp = await c.post("/api/sessions")
    assert resp.status_code == 200
    data = resp.json()
    assert "session_id" in data
    assert len(data["session_id"]) == 36


@pytest.mark.asyncio
async def test_create_session_with_requirements(client):
    payload = {
        "project_description": "Test app",
        "project_type": "web_app",
        "expected_users": "1K-100K",
        "budget": "startup",
        "team_size": 3,
        "team_experience": "mid",
        "language_preferences": ["python"],
        "compliance_needs": [],
        "timeline": "3_months",
        "priorities": {"scalability": 7},
    }
    async with client as c:
        resp = await c.post("/api/sessions", json=payload)
    assert resp.status_code == 200
    sid = resp.json()["session_id"]
    # Verify requirements were stored
    session = session_store.get(sid)
    assert session.requirements is not None


@pytest.mark.asyncio
async def test_get_session(client):
    async with client as c:
        create_resp = await c.post("/api/sessions")
        sid = create_resp.json()["session_id"]
        resp = await c.get(f"/api/sessions/{sid}")
    assert resp.status_code == 200
    assert resp.json()["id"] == sid
    assert resp.json()["status"] == "input"


@pytest.mark.asyncio
async def test_get_session_not_found(client):
    async with client as c:
        resp = await c.get("/api/sessions/nonexistent-id")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_results_empty(client):
    async with client as c:
        create_resp = await c.post("/api/sessions")
        sid = create_resp.json()["session_id"]
        resp = await c.get(f"/api/sessions/{sid}/results")
    assert resp.status_code == 200
    assert resp.json() is None


@pytest.mark.asyncio
async def test_get_results_not_found(client):
    async with client as c:
        resp = await c.get("/api/sessions/nonexistent/results")
    assert resp.status_code == 404
