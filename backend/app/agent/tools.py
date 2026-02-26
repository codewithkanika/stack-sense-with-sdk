"""
Custom MCP tools for StackAdvisor AI agent.

These tools are used by the orchestrator and subagents during tech stack evaluation.
They are defined as async functions with a TOOL_DEFINITIONS list (following the
Anthropic tool-use schema) and a TOOL_HANDLERS registry for dispatch.

Tools:
- search_tech_benchmarks: Search for performance benchmarks for a technology
- get_github_stats: Fetch GitHub repository statistics via the GitHub API
- compare_cloud_pricing: Compare pricing across AWS, GCP, and Azure
- generate_comparison_matrix: Build a structured comparison matrix for technologies
- request_user_approval: Request human-in-the-loop approval (handled by orchestrator)
"""

import httpx
import logging
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Tool definitions — Anthropic tool-use schema
# These are passed to the Claude API when creating messages so the model knows
# which tools are available and how to invoke them.
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "name": "search_tech_benchmarks",
        "description": "Search for latest performance benchmarks for a technology. Returns structured benchmark metadata that the agent can use to compare technologies.",
        "input_schema": {
            "type": "object",
            "properties": {
                "technology": {
                    "type": "string",
                    "description": "Technology to search benchmarks for (e.g., 'React', 'PostgreSQL', 'Go')",
                },
                "benchmark_type": {
                    "type": "string",
                    "description": "Type of benchmark (e.g., 'performance', 'throughput', 'latency', 'memory')",
                },
            },
            "required": ["technology"],
        },
    },
    {
        "name": "get_github_stats",
        "description": "Get GitHub repository statistics for a technology including stars, forks, open issues, primary language, and last push date.",
        "input_schema": {
            "type": "object",
            "properties": {
                "repo_owner": {
                    "type": "string",
                    "description": "GitHub repository owner (e.g., 'facebook')",
                },
                "repo_name": {
                    "type": "string",
                    "description": "GitHub repository name (e.g., 'react')",
                },
            },
            "required": ["repo_owner", "repo_name"],
        },
    },
    {
        "name": "compare_cloud_pricing",
        "description": "Compare pricing across cloud providers (AWS, GCP, Azure) for a given service type and usage tier.",
        "input_schema": {
            "type": "object",
            "properties": {
                "service_type": {
                    "type": "string",
                    "description": "Type of cloud service (e.g., 'compute', 'database', 'storage', 'cdn')",
                },
                "usage_tier": {
                    "type": "string",
                    "description": "Usage tier (e.g., 'small', 'medium', 'large', 'enterprise')",
                },
            },
            "required": ["service_type"],
        },
    },
    {
        "name": "generate_comparison_matrix",
        "description": "Generate a structured comparison matrix for evaluating multiple technologies against a set of criteria. Returns a matrix with 'pending_evaluation' cells for the agent to fill in.",
        "input_schema": {
            "type": "object",
            "properties": {
                "technologies": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of technologies to compare (e.g., ['React', 'Vue', 'Svelte'])",
                },
                "criteria": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Evaluation criteria (e.g., ['performance', 'learning_curve', 'ecosystem'])",
                },
            },
            "required": ["technologies", "criteria"],
        },
    },
    {
        "name": "request_user_approval",
        "description": "Request human approval for a recommendation before proceeding. This pauses the agent workflow and waits for the user to approve, modify, or reject the recommendation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Short title for the approval request",
                },
                "description": {
                    "type": "string",
                    "description": "Detailed description of what is being recommended and why",
                },
                "recommendation": {
                    "type": "object",
                    "description": "The structured recommendation object to be approved",
                },
            },
            "required": ["title", "description", "recommendation"],
        },
    },
]

# ---------------------------------------------------------------------------
# Tool handler implementations
# ---------------------------------------------------------------------------


async def search_tech_benchmarks(
    technology: str, benchmark_type: str = "performance"
) -> dict[str, Any]:
    """Search for latest performance benchmarks for a technology.

    In production this will be enhanced with web search (via MCP or direct API)
    to fetch real-time benchmark data. For now it returns structured metadata
    that signals to the agent what data is expected.
    """
    logger.info(
        "search_tech_benchmarks called: technology=%s, benchmark_type=%s",
        technology,
        benchmark_type,
    )
    return {
        "technology": technology,
        "benchmark_type": benchmark_type,
        "note": "Benchmark data will be fetched via web search at runtime by the agent",
    }


async def get_github_stats(repo_owner: str, repo_name: str) -> dict[str, Any]:
    """Get GitHub repository statistics via the public GitHub API.

    Returns stars, forks, open issues, primary language, last push date,
    and description. Uses unauthenticated requests (60 req/hr rate limit).
    """
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}"
    logger.info("get_github_stats called: %s/%s", repo_owner, repo_name)

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                url, headers={"Accept": "application/vnd.github.v3+json"}
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "name": data["full_name"],
                    "stars": data["stargazers_count"],
                    "forks": data["forks_count"],
                    "open_issues": data["open_issues_count"],
                    "language": data["language"],
                    "last_push": data["pushed_at"],
                    "description": data["description"],
                }
            logger.warning(
                "GitHub API returned status %d for %s/%s",
                resp.status_code,
                repo_owner,
                repo_name,
            )
            return {"error": f"GitHub API returned {resp.status_code}"}
        except httpx.TimeoutException:
            logger.error("Timeout fetching GitHub stats for %s/%s", repo_owner, repo_name)
            return {"error": "Request timed out"}
        except Exception as e:
            logger.error(
                "Error fetching GitHub stats for %s/%s: %s",
                repo_owner,
                repo_name,
                str(e),
            )
            return {"error": str(e)}


async def compare_cloud_pricing(
    service_type: str, usage_tier: str = "medium"
) -> dict[str, Any]:
    """Compare pricing across cloud providers for a given service type and tier.

    Uses a static pricing reference table. In production this would fetch
    live pricing from AWS, GCP, and Azure pricing APIs.
    """
    logger.info(
        "compare_cloud_pricing called: service_type=%s, usage_tier=%s",
        service_type,
        usage_tier,
    )

    pricing_data: dict[str, dict[str, dict[str, str]]] = {
        "compute": {
            "small": {
                "aws": "$15/mo (t3.micro)",
                "gcp": "$12/mo (e2-micro)",
                "azure": "$14/mo (B1s)",
            },
            "medium": {
                "aws": "$60/mo (t3.medium)",
                "gcp": "$50/mo (e2-medium)",
                "azure": "$55/mo (B2s)",
            },
            "large": {
                "aws": "$180/mo (m5.xlarge)",
                "gcp": "$160/mo (n2-standard-4)",
                "azure": "$170/mo (D4s_v3)",
            },
            "enterprise": {
                "aws": "$700/mo (m5.4xlarge)",
                "gcp": "$620/mo (n2-standard-16)",
                "azure": "$680/mo (D16s_v3)",
            },
        },
        "database": {
            "small": {
                "aws_rds": "$15/mo",
                "gcp_cloudsql": "$12/mo",
                "azure_sql": "$15/mo",
            },
            "medium": {
                "aws_rds": "$100/mo",
                "gcp_cloudsql": "$80/mo",
                "azure_sql": "$95/mo",
            },
            "large": {
                "aws_rds": "$400/mo",
                "gcp_cloudsql": "$350/mo",
                "azure_sql": "$380/mo",
            },
            "enterprise": {
                "aws_rds": "$1500/mo",
                "gcp_cloudsql": "$1300/mo",
                "azure_sql": "$1400/mo",
            },
        },
        "storage": {
            "small": {
                "aws_s3": "$0.023/GB",
                "gcp_gcs": "$0.020/GB",
                "azure_blob": "$0.018/GB",
            },
            "medium": {
                "aws_s3": "$0.023/GB (100GB ~$2.30)",
                "gcp_gcs": "$0.020/GB (100GB ~$2.00)",
                "azure_blob": "$0.018/GB (100GB ~$1.80)",
            },
            "large": {
                "aws_s3": "$0.023/GB (1TB ~$23)",
                "gcp_gcs": "$0.020/GB (1TB ~$20)",
                "azure_blob": "$0.018/GB (1TB ~$18)",
            },
        },
        "cdn": {
            "small": {
                "aws_cloudfront": "$0.085/GB",
                "gcp_cdn": "$0.08/GB",
                "azure_cdn": "$0.081/GB",
            },
            "medium": {
                "aws_cloudfront": "$0.085/GB (100GB ~$8.50)",
                "gcp_cdn": "$0.08/GB (100GB ~$8.00)",
                "azure_cdn": "$0.081/GB (100GB ~$8.10)",
            },
            "large": {
                "aws_cloudfront": "$0.060/GB (10TB+)",
                "gcp_cdn": "$0.06/GB (10TB+)",
                "azure_cdn": "$0.065/GB (10TB+)",
            },
        },
    }

    tier_pricing = pricing_data.get(service_type, {}).get(usage_tier)
    if tier_pricing is None:
        available_services = list(pricing_data.keys())
        available_tiers = list(pricing_data.get(service_type, {}).keys()) or ["N/A"]
        return {
            "service_type": service_type,
            "usage_tier": usage_tier,
            "pricing": None,
            "note": f"No data for this combination. Available services: {available_services}. Available tiers for '{service_type}': {available_tiers}",
        }

    return {
        "service_type": service_type,
        "usage_tier": usage_tier,
        "pricing": tier_pricing,
    }


async def generate_comparison_matrix(
    technologies: list[str], criteria: list[str]
) -> dict[str, Any]:
    """Generate a structured comparison matrix for technologies.

    Creates a matrix with technologies as rows and criteria as columns,
    initialized to 'pending_evaluation'. The agent fills in the evaluations
    based on its analysis.
    """
    logger.info(
        "generate_comparison_matrix called: technologies=%s, criteria=%s",
        technologies,
        criteria,
    )
    matrix = {
        tech: {criterion: "pending_evaluation" for criterion in criteria}
        for tech in technologies
    }
    return {
        "technologies": technologies,
        "criteria": criteria,
        "matrix": matrix,
    }


# ---------------------------------------------------------------------------
# Tool dispatch registry
# Maps tool names to their async handler functions.
# Note: request_user_approval is intentionally omitted — it is handled
# specially by the orchestrator (pauses the workflow and sends a WebSocket
# message to the frontend for human-in-the-loop approval).
# ---------------------------------------------------------------------------

TOOL_HANDLERS: dict[str, Any] = {
    "search_tech_benchmarks": search_tech_benchmarks,
    "get_github_stats": get_github_stats,
    "compare_cloud_pricing": compare_cloud_pricing,
    "generate_comparison_matrix": generate_comparison_matrix,
}


async def dispatch_tool(tool_name: str, tool_input: dict[str, Any]) -> dict[str, Any]:
    """Dispatch a tool call by name with the given input.

    This is the main entry point used by the orchestrator to execute
    tool calls that come back from the Claude API.

    Args:
        tool_name: Name of the tool to invoke (must be in TOOL_HANDLERS).
        tool_input: Dictionary of keyword arguments for the tool function.

    Returns:
        The tool result as a dictionary.

    Raises:
        ValueError: If the tool_name is not found in TOOL_HANDLERS.
    """
    handler = TOOL_HANDLERS.get(tool_name)
    if handler is None:
        if tool_name == "request_user_approval":
            raise ValueError(
                "request_user_approval must be handled by the orchestrator, "
                "not dispatched through the generic tool handler."
            )
        raise ValueError(f"Unknown tool: {tool_name}")

    logger.info("Dispatching tool: %s", tool_name)
    return await handler(**tool_input)
