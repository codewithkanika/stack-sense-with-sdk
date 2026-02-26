# StackAdvisor

AI-powered tech stack evaluation agent that helps teams choose the right technology stack for new products or migrations. It evaluates requirements, compares options across frontend/backend/database/infrastructure, and provides tailored recommendations with justifications.

## Tech Stack

- **Backend**: Python + FastAPI + WebSocket + Claude Agent SDK
- **Frontend**: Next.js 15 + React 19 + Tailwind CSS + TypeScript + Zustand + Recharts
- **AI**: Claude Agent SDK with 6 specialized subagents
- **Communication**: WebSocket (real-time streaming) + REST (CRUD)

## Features

- Evaluate technology stack components (frontend frameworks, databases, cloud platforms)
- Accept input criteria: scalability, cost, language preferences, compliance needs
- Compare trade-offs and provide clear stack recommendations with justifications
- Support scenario planning: "What if we switched to X?" or "Which option scales to 10M users?"
- Human-in-the-loop approval gates before finalizing recommendations

## Project Structure

```
stack-sense-with-sdk/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app, CORS, router mounting
│   │   ├── config.py               # Pydantic Settings (env config)
│   │   ├── api/
│   │   │   ├── routes.py           # REST endpoints (sessions CRUD)
│   │   │   └── websocket.py        # WebSocket endpoint with message routing
│   │   ├── models/
│   │   │   ├── schemas.py          # Pydantic models (requirements, recommendations, messages)
│   │   │   └── session.py          # In-memory session store
│   │   └── agent/
│   │       ├── tools.py            # Custom tools (GitHub stats, benchmarks, pricing, etc.)
│   │       ├── prompts.py          # System prompts for orchestrator + subagents
│   │       └── subagents.py        # Subagent definitions (6 evaluators)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js app router pages
│   │   ├── components/
│   │   │   └── layout/Header.tsx   # App header
│   │   └── types/index.ts          # TypeScript interfaces
│   └── package.json
├── docs/
│   └── PLAN.md                     # Full architecture and specs
└── FEATURES.md                     # Feature checklist with status
```

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
uvicorn app.main:app --reload
```

Backend runs on http://localhost:8000. Verify with `GET /health`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/sessions` | Create evaluation session |
| GET | `/api/sessions/{id}` | Get session data |
| GET | `/api/sessions/{id}/results` | Get recommendations |
| WS | `/ws/{session_id}` | WebSocket for real-time communication |

## Agent Architecture

The orchestrator coordinates 6 specialized subagents:

| Subagent | Role |
|----------|------|
| requirements-analyzer | Parses and clarifies project requirements |
| frontend-evaluator | Evaluates UI frameworks (React, Vue, Angular, Svelte, etc.) |
| backend-evaluator | Evaluates server-side tech (Node, Python, Go, Rust, etc.) |
| database-evaluator | Evaluates databases (PostgreSQL, MongoDB, DynamoDB, etc.) |
| infrastructure-evaluator | Evaluates cloud, on-prem, and hybrid deployment (AWS, GCP, K8s, etc.) |
| scenario-planner | Analyzes "what-if" scenarios for stack changes |

## Current Status

Features 1-18 of 27 complete. See [FEATURES.md](FEATURES.md) for detailed progress.

- [x] Backend scaffolding (FastAPI, CORS, health check)
- [x] Frontend scaffolding (Next.js, Tailwind, Header)
- [x] Data models & types (Pydantic + TypeScript)
- [x] Session management (in-memory store, REST API)
- [x] WebSocket layer (message routing)
- [x] Custom MCP tools (GitHub stats, benchmarks, pricing)
- [x] Agent prompts & subagent definitions
- [x] Orchestrator agent (Anthropic API, tool dispatch, approval gates)
- [x] Wire orchestrator to WebSocket
- [x] Landing page (requirements form + priority sliders)
- [x] WebSocket hook + Zustand store
- [x] Chat panel + message bubbles
- [x] Approval gate UI (approve/modify/reject)
- [x] Recommendation cards with confidence scores
- [x] Alternatives & comparison table (sortable)
- [x] Trade-off radar chart (Recharts)
- [x] Scenario planning panel
- [x] Evaluation dashboard layout (split view)
- [ ] Tests (unit, integration, E2E) — 5 features
- [ ] Docker + CI/CD + AWS deployment — 3 features
