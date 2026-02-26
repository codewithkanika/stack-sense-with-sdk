"""Unit tests for agent prompts."""

from app.agent.prompts import (
    ORCHESTRATOR_SYSTEM_PROMPT,
    REQUIREMENTS_ANALYZER_PROMPT,
    FRONTEND_EVALUATOR_PROMPT,
    BACKEND_EVALUATOR_PROMPT,
    DATABASE_EVALUATOR_PROMPT,
    INFRASTRUCTURE_EVALUATOR_PROMPT,
    SCENARIO_PLANNER_PROMPT,
)

ALL_PROMPTS = {
    "orchestrator": ORCHESTRATOR_SYSTEM_PROMPT,
    "requirements_analyzer": REQUIREMENTS_ANALYZER_PROMPT,
    "frontend_evaluator": FRONTEND_EVALUATOR_PROMPT,
    "backend_evaluator": BACKEND_EVALUATOR_PROMPT,
    "database_evaluator": DATABASE_EVALUATOR_PROMPT,
    "infrastructure_evaluator": INFRASTRUCTURE_EVALUATOR_PROMPT,
    "scenario_planner": SCENARIO_PLANNER_PROMPT,
}


def test_all_prompts_are_non_empty_strings():
    for name, prompt in ALL_PROMPTS.items():
        assert isinstance(prompt, str), f"{name} is not a string"
        assert len(prompt) > 50, f"{name} is too short"


def test_orchestrator_contains_workflow():
    assert "WORKFLOW" in ORCHESTRATOR_SYSTEM_PROMPT
    assert "StackAdvisor" in ORCHESTRATOR_SYSTEM_PROMPT
    assert "request_user_approval" in ORCHESTRATOR_SYSTEM_PROMPT


def test_frontend_evaluator_mentions_frameworks():
    assert "React" in FRONTEND_EVALUATOR_PROMPT
    assert "Vue" in FRONTEND_EVALUATOR_PROMPT
    assert "Angular" in FRONTEND_EVALUATOR_PROMPT


def test_backend_evaluator_mentions_frameworks():
    assert "FastAPI" in BACKEND_EVALUATOR_PROMPT
    assert "Django" in BACKEND_EVALUATOR_PROMPT
    assert "Express" in BACKEND_EVALUATOR_PROMPT


def test_database_evaluator_mentions_databases():
    assert "PostgreSQL" in DATABASE_EVALUATOR_PROMPT
    assert "MongoDB" in DATABASE_EVALUATOR_PROMPT


def test_infrastructure_evaluator_mentions_providers():
    assert "AWS" in INFRASTRUCTURE_EVALUATOR_PROMPT
    assert "GCP" in INFRASTRUCTURE_EVALUATOR_PROMPT
    assert "Azure" in INFRASTRUCTURE_EVALUATOR_PROMPT


def test_scenario_planner_mentions_analysis():
    assert "what-if" in SCENARIO_PLANNER_PROMPT.lower() or "what if" in SCENARIO_PLANNER_PROMPT.lower()
    assert "migration" in SCENARIO_PLANNER_PROMPT.lower()
