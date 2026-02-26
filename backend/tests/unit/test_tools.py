"""Unit tests for MCP tools."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import httpx

from app.agent.tools import (
    search_tech_benchmarks,
    get_github_stats,
    compare_cloud_pricing,
    generate_comparison_matrix,
    dispatch_tool,
)


# --- search_tech_benchmarks ---

@pytest.mark.asyncio
async def test_search_tech_benchmarks_default():
    result = await search_tech_benchmarks("React")
    assert result["technology"] == "React"
    assert result["benchmark_type"] == "performance"


@pytest.mark.asyncio
async def test_search_tech_benchmarks_custom_type():
    result = await search_tech_benchmarks("PostgreSQL", benchmark_type="throughput")
    assert result["benchmark_type"] == "throughput"


# --- get_github_stats ---

@pytest.mark.asyncio
async def test_get_github_stats_success():
    mock_data = {
        "full_name": "facebook/react",
        "stargazers_count": 200000,
        "forks_count": 40000,
        "open_issues_count": 1000,
        "language": "JavaScript",
        "pushed_at": "2024-01-01T00:00:00Z",
        "description": "A JavaScript library for building UIs",
    }
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_data

    with patch("app.agent.tools.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        result = await get_github_stats("facebook", "react")

    assert result["stars"] == 200000
    assert result["name"] == "facebook/react"


@pytest.mark.asyncio
async def test_get_github_stats_not_found():
    mock_response = MagicMock()
    mock_response.status_code = 404

    with patch("app.agent.tools.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get.return_value = mock_response
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        result = await get_github_stats("nonexistent", "repo")

    assert "error" in result


@pytest.mark.asyncio
async def test_get_github_stats_timeout():
    with patch("app.agent.tools.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.get.side_effect = httpx.TimeoutException("timeout")
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client_cls.return_value = mock_client

        result = await get_github_stats("facebook", "react")

    assert result["error"] == "Request timed out"


# --- compare_cloud_pricing ---

@pytest.mark.asyncio
async def test_compare_cloud_pricing_valid():
    result = await compare_cloud_pricing("compute", "medium")
    assert result["pricing"] is not None
    assert "aws" in result["pricing"]
    assert "gcp" in result["pricing"]


@pytest.mark.asyncio
async def test_compare_cloud_pricing_invalid_service():
    result = await compare_cloud_pricing("quantum_computing", "small")
    assert result["pricing"] is None
    assert "note" in result


@pytest.mark.asyncio
async def test_compare_cloud_pricing_default_tier():
    result = await compare_cloud_pricing("database")
    assert result["usage_tier"] == "medium"


# --- generate_comparison_matrix ---

@pytest.mark.asyncio
async def test_generate_comparison_matrix():
    result = await generate_comparison_matrix(
        technologies=["React", "Vue", "Svelte"],
        criteria=["performance", "ecosystem"],
    )
    assert len(result["technologies"]) == 3
    assert "React" in result["matrix"]
    assert result["matrix"]["React"]["performance"] == "pending_evaluation"


# --- dispatch_tool ---

@pytest.mark.asyncio
async def test_dispatch_tool_known():
    result = await dispatch_tool(
        "search_tech_benchmarks", {"technology": "Go"}
    )
    assert result["technology"] == "Go"


@pytest.mark.asyncio
async def test_dispatch_tool_unknown():
    with pytest.raises(ValueError, match="Unknown tool"):
        await dispatch_tool("nonexistent_tool", {})


@pytest.mark.asyncio
async def test_dispatch_tool_approval_rejected():
    with pytest.raises(ValueError, match="request_user_approval"):
        await dispatch_tool("request_user_approval", {})
