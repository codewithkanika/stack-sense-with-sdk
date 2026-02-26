"""Unit tests for session store."""

import pytest

from app.models.session import SessionStore, SessionData
from app.models.schemas import (
    ProjectRequirements,
    StackRecommendation,
    TechRecommendation,
)


@pytest.fixture
def store():
    return SessionStore()


@pytest.fixture
def sample_requirements():
    return ProjectRequirements(
        project_description="Test project",
        project_type="web_app",
        expected_users="1K-100K",
        budget="startup",
        team_size=3,
        team_experience="mid",
        language_preferences=["python"],
        compliance_needs=[],
        timeline="3_months",
        priorities={"scalability": 7},
    )


def test_create_returns_uuid(store):
    sid = store.create()
    assert isinstance(sid, str)
    assert len(sid) == 36  # UUID format


def test_get_returns_session(store):
    sid = store.create()
    session = store.get(sid)
    assert session is not None
    assert session.id == sid
    assert session.status == "input"


def test_get_missing_returns_none(store):
    assert store.get("nonexistent") is None


def test_create_with_requirements(store, sample_requirements):
    sid = store.create(sample_requirements)
    session = store.get(sid)
    assert session.requirements is not None
    assert session.requirements.project_type == "web_app"


def test_update_modifies_fields(store):
    sid = store.create()
    store.update(sid, status="evaluating")
    session = store.get(sid)
    assert session.status == "evaluating"


def test_update_nonexistent_no_error(store):
    # Should not raise
    store.update("nonexistent", status="evaluating")


def test_save_result(store):
    sid = store.create()
    rec = TechRecommendation(
        category="backend",
        technology="FastAPI",
        confidence=0.9,
        justification="Fast",
        pros=["Speed"],
        cons=["New"],
        learning_curve="low",
        community_score="growing",
    )
    stack = StackRecommendation(
        primary=[rec],
        alternatives={},
        overall_justification="Good",
        estimated_monthly_cost="$50",
        scalability_assessment="Good",
        risk_factors=[],
    )
    store.save_result(sid, stack)
    session = store.get(sid)
    assert session.status == "completed"
    assert session.recommendations is not None
    assert session.recommendations.primary[0].technology == "FastAPI"


def test_list_all(store):
    store.create()
    store.create()
    store.create()
    assert len(store.list_all()) == 3
