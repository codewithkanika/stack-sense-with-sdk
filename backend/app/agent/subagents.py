from app.agent.prompts import (
    REQUIREMENTS_ANALYZER_PROMPT,
    FRONTEND_EVALUATOR_PROMPT,
    BACKEND_EVALUATOR_PROMPT,
    DATABASE_EVALUATOR_PROMPT,
    INFRASTRUCTURE_EVALUATOR_PROMPT,
    SCENARIO_PLANNER_PROMPT,
)

# Subagent definition structure for the orchestrator
SUBAGENT_DEFINITIONS = {
    "requirements-analyzer": {
        "name": "requirements-analyzer",
        "description": "Analyzes project requirements, extracts structured data, identifies ambiguities",
        "prompt": REQUIREMENTS_ANALYZER_PROMPT,
        "tools": ["WebSearch"],
    },
    "frontend-evaluator": {
        "name": "frontend-evaluator",
        "description": "Evaluates frontend frameworks and UI technologies",
        "prompt": FRONTEND_EVALUATOR_PROMPT,
        "tools": ["WebSearch", "WebFetch", "get_github_stats", "search_tech_benchmarks"],
    },
    "backend-evaluator": {
        "name": "backend-evaluator",
        "description": "Evaluates backend languages and server-side frameworks",
        "prompt": BACKEND_EVALUATOR_PROMPT,
        "tools": ["WebSearch", "WebFetch", "get_github_stats", "search_tech_benchmarks"],
    },
    "database-evaluator": {
        "name": "database-evaluator",
        "description": "Evaluates databases and data storage solutions",
        "prompt": DATABASE_EVALUATOR_PROMPT,
        "tools": ["WebSearch", "WebFetch", "search_tech_benchmarks", "compare_cloud_pricing"],
    },
    "infrastructure-evaluator": {
        "name": "infrastructure-evaluator",
        "description": "Evaluates cloud platforms and deployment strategies",
        "prompt": INFRASTRUCTURE_EVALUATOR_PROMPT,
        "tools": ["WebSearch", "WebFetch", "compare_cloud_pricing"],
    },
    "scenario-planner": {
        "name": "scenario-planner",
        "description": "Analyzes what-if scenarios for tech stack changes",
        "prompt": SCENARIO_PLANNER_PROMPT,
        "tools": ["WebSearch", "WebFetch", "get_github_stats", "search_tech_benchmarks", "compare_cloud_pricing", "generate_comparison_matrix"],
    },
}


def get_subagent_definitions() -> dict:
    """Return all subagent definitions for the orchestrator."""
    return SUBAGENT_DEFINITIONS
