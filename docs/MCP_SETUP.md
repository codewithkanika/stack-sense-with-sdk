# MCP Server Setup for StackAdvisor

Run these commands once to enable MCP servers for Claude Code.

## GitHub MCP Server (Official)

For repo management, PRs, issues, code review.

```bash
# Replace YOUR_GITHUB_PAT with your GitHub Personal Access Token
# Create PAT at: https://github.com/settings/tokens
claude mcp add-json github '{"type":"http","url":"https://api.githubcopilot.com/mcp","headers":{"Authorization":"Bearer YOUR_GITHUB_PAT"}}'
```

## AWS MCP Server (Official)

For infrastructure management, resource provisioning, troubleshooting.

```bash
# Requires AWS credentials configured locally (aws configure)
claude mcp add awslabs.core-mcp-server -s user -e FASTMCP_LOG_LEVEL=ERROR -- uvx awslabs.core-mcp-server@latest
```

## Verify Setup

```bash
claude mcp list          # See all configured servers
claude mcp get github    # Check GitHub server details
```

## Remove if Needed

```bash
claude mcp remove github
claude mcp remove awslabs.core-mcp-server
```
