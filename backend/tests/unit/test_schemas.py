"""Unit tests for Pydantic schemas."""

import pytest
from datetime import datetime
from pydantic import ValidationError

from app.models.schemas import (
    ProjectRequirements,
    TechRecommendation,
    StackRecommendation,
    WSMessage,
    ApprovalRequest,
    ApprovalResponse,
)


# --- ProjectRequirements ---

def test_project_requirements_valid():
    req = ProjectRequirements(
        project_description="E-commerce platform",
        project_type="web_app",
        expected_users="1K-100K",
        budget="startup",
        team_size=5,
        team_experience="mid",
        language_preferences=["python", "typescript"],
        compliance_needs=["GDPR"],
        timeline="3_months",
        priorities={"scalability": 8, "cost": 6},
    )
    assert req.project_type == "web_app"
    assert req.team_size == 5
    assert req.existing_stack is None


def test_project_requirements_with_existing_stack():
    req = ProjectRequirements(
        project_description="Migration",
        project_type="saas",
        expected_users="10M+",
        budget="enterprise",
        team_size=20,
        team_experience="senior",
        language_preferences=["go"],
        compliance_needs=["SOC2", "HIPAA"],
        timeline="12_months",
        existing_stack="Django monolith",
        priorities={"scalability": 10},
    )
    assert req.existing_stack == "Django monolith"


def test_project_requirements_missing_required_field():
    with pytest.raises(ValidationError):
        ProjectRequirements(
            project_description="Test",
            # missing project_type and other required fields
        )


# --- TechRecommendation ---

def test_tech_recommendation_valid():
    rec = TechRecommendation(
        category="frontend",
        technology="React",
        confidence=0.9,
        justification="Mature ecosystem",
        pros=["Large community", "Rich ecosystem"],
        cons=["Bundle size"],
        learning_curve="medium",
        community_score="massive",
    )
    assert rec.confidence == 0.9
    assert rec.monthly_cost_estimate is None


def test_tech_recommendation_with_cost():
    rec = TechRecommendation(
        category="database",
        technology="PostgreSQL",
        confidence=0.95,
        justification="Reliable RDBMS",
        pros=["ACID"],
        cons=["Scaling"],
        monthly_cost_estimate="$100/mo",
        learning_curve="medium",
        community_score="massive",
    )
    assert rec.monthly_cost_estimate == "$100/mo"


# --- StackRecommendation ---

def test_stack_recommendation_valid():
    primary = TechRecommendation(
        category="backend",
        technology="FastAPI",
        confidence=0.88,
        justification="High performance",
        pros=["Fast"],
        cons=["Newer"],
        learning_curve="low",
        community_score="growing",
    )
    stack = StackRecommendation(
        primary=[primary],
        alternatives={"backend": []},
        overall_justification="Good fit",
        estimated_monthly_cost="$200/mo",
        scalability_assessment="Excellent",
        risk_factors=["New framework"],
    )
    assert len(stack.primary) == 1
    assert stack.primary[0].technology == "FastAPI"


# --- WSMessage ---

def test_ws_message_valid():
    msg = WSMessage(
        type="user_message",
        payload={"message": "hello"},
        session_id="abc-123",
        timestamp=datetime.utcnow(),
    )
    assert msg.type == "user_message"


def test_ws_message_missing_type():
    with pytest.raises(ValidationError):
        WSMessage(
            payload={"message": "hello"},
            session_id="abc-123",
            timestamp=datetime.utcnow(),
        )


# --- ApprovalRequest ---

def test_approval_request_defaults():
    primary = TechRecommendation(
        category="backend",
        technology="FastAPI",
        confidence=0.88,
        justification="Good",
        pros=["Fast"],
        cons=["New"],
        learning_curve="low",
        community_score="growing",
    )
    stack = StackRecommendation(
        primary=[primary],
        alternatives={},
        overall_justification="Solid",
        estimated_monthly_cost="$50",
        scalability_assessment="Good",
        risk_factors=[],
    )
    ar = ApprovalRequest(
        id="req-1",
        title="Stack Recommendation",
        description="Please review",
        proposed_stack=stack,
    )
    assert ar.options == ["approve", "modify", "reject"]


# --- ApprovalResponse ---

def test_approval_response_approve():
    resp = ApprovalResponse(request_id="req-1", decision="approve")
    assert resp.feedback is None


def test_approval_response_with_feedback():
    resp = ApprovalResponse(
        request_id="req-1",
        decision="modify",
        feedback="Use Vue instead of React",
    )
    assert resp.feedback == "Use Vue instead of React"
