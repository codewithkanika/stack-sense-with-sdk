# StackAdvisor — Feature Checklist

## Problem Statement
Choosing the right tech stack for a new product or migration is complex and time-consuming. StackAdvisor is an AI agent that streamlines this by evaluating requirements, comparing options, and offering tailored recommendations based on use case, scalability, and organizational constraints.

**Objectives**:
1. Evaluate technology stack components (frontend frameworks, databases, cloud platforms)
2. Accept input criteria: scalability, cost, language preferences, compliance needs
3. Compare trade-offs and provide clear stack recommendations with justifications
4. Support scenario planning: "What if we switched to X?" or "Which option scales to 10M users?"

**Stack**: Claude Agent SDK (Python) + FastAPI + WebSocket backend, Next.js + Tailwind frontend. Human-in-the-loop via chat + approval gates. See `docs/PLAN.md` for full architecture and specs.

---

Work through these features one at a time, in order. Each is self-contained and can be done in a single session.

---

## Feature 1: Backend Scaffolding
**Scope**: Python project setup, FastAPI app, health check, CORS, config
**Files**: `backend/app/main.py`, `backend/app/config.py`, `backend/requirements.txt`, `backend/.env.example`, `backend/app/__init__.py`
**Test**: `uvicorn app.main:app --reload` → `/health` returns `{"status": "ok"}`
**Status**: [x] Complete

---

## Feature 2: Frontend Scaffolding
**Scope**: Next.js + Tailwind app, install zustand/recharts/lucide-react, basic layout (Header component)
**Files**: `frontend/` (create-next-app), `frontend/src/components/layout/Header.tsx`
**Test**: `npm run dev` → page renders with header
**Status**: [x] Complete

---

## Feature 3: Data Models & Types
**Scope**: Pydantic schemas (backend) + TypeScript interfaces (frontend)
**Files**: `backend/app/models/schemas.py`, `backend/app/models/__init__.py`, `frontend/src/types/index.ts`
**Test**: Import schemas in Python REPL, no errors. TypeScript compiles.
**Status**: [x] Complete

---

## Feature 4: Session Management (Backend)
**Scope**: In-memory session store, REST endpoints for create/get session
**Files**: `backend/app/models/session.py`, `backend/app/api/routes.py`, `backend/app/api/__init__.py`
**Test**: `POST /api/sessions` returns session_id, `GET /api/sessions/{id}` returns session data
**Status**: [x] Complete

---

## Feature 5: WebSocket Layer (Backend)
**Scope**: WebSocket endpoint, message routing (user_message, start_evaluation, approval_response, scenario_query)
**Files**: `backend/app/api/websocket.py`
**Test**: Connect via browser console `new WebSocket("ws://localhost:8000/ws/test")`, send/receive JSON
**Status**: [x] Complete

---

## Feature 6: Custom MCP Tools
**Scope**: Define tools — get_github_stats, search_tech_benchmarks, compare_cloud_pricing, generate_comparison_matrix, request_user_approval
**Files**: `backend/app/agent/tools.py`, `backend/app/agent/__init__.py`
**Test**: Import tools, verify MCP server creates without errors
**Status**: [x] Complete

---

## Feature 7: Agent Prompts & Subagent Definitions
**Scope**: System prompts for orchestrator + all 6 subagents (requirements-analyzer, frontend/backend/database/infrastructure evaluators, scenario-planner)
**Files**: `backend/app/agent/prompts.py`, `backend/app/agent/subagents.py`
**Test**: Import definitions, verify structure matches AgentDefinition format
**Status**: [x] Complete

---

## Feature 8: Orchestrator Agent
**Scope**: EvaluationOrchestrator class — initialize SDK client, approval gate callback, evaluate(), handle_chat(), message routing
**Files**: `backend/app/agent/orchestrator.py`, `backend/app/services/evaluation.py`, `backend/app/services/__init__.py`
**Test**: Create orchestrator instance, send a test prompt, verify messages stream
**Status**: [ ] Not started

---

## Feature 9: Wire Orchestrator to WebSocket
**Scope**: Connect WebSocket handler to orchestrator — relay messages bidirectionally
**Files**: Update `backend/app/api/websocket.py` to use orchestrator
**Test**: Send `{"type": "user_message", "payload": {"message": "hello"}}` via WS → get agent response back
**Status**: [ ] Not started

---

## Feature 10: Landing Page — Requirements Form
**Scope**: RequirementsForm + CriteriaSliders components, form validation, submit calls POST /api/sessions and navigates to /evaluate
**Files**: `frontend/src/app/page.tsx`, `frontend/src/components/input/RequirementsForm.tsx`, `frontend/src/components/input/CriteriaSliders.tsx`
**Test**: Fill form → submit → navigates to `/evaluate?session=xxx`
**Status**: [ ] Not started

---

## Feature 11: WebSocket Hook + Zustand Store
**Scope**: useWebSocket hook (connect, send, reconnect), evaluationStore (messages, recommendations, approvals, phase)
**Files**: `frontend/src/hooks/useWebSocket.ts`, `frontend/src/store/evaluationStore.ts`
**Test**: Hook connects to backend WS, messages dispatch to store
**Status**: [ ] Not started

---

## Feature 12: Chat Panel
**Scope**: ChatPanel + MessageBubble components, real-time message display, text input + send
**Files**: `frontend/src/components/chat/ChatPanel.tsx`, `frontend/src/components/chat/MessageBubble.tsx`
**Test**: Type message → appears in chat → agent response streams back
**Status**: [ ] Not started

---

## Feature 13: Approval Gate UI
**Scope**: ApprovalGate component — shows recommendation summary, Approve/Modify/Reject buttons, sends response via WS
**Files**: `frontend/src/components/chat/ApprovalGate.tsx`
**Test**: Approval card renders inline in chat, clicking Approve sends WS message, card updates state
**Status**: [ ] Not started

---

## Feature 14: Recommendation Cards
**Scope**: RecommendationCard component — displays primary stack per category (Frontend, Backend, Database, Infra) with confidence, pros/cons, justification
**Files**: `frontend/src/components/results/RecommendationCard.tsx`
**Test**: Cards render with mock data, confidence bar shows correctly
**Status**: [ ] Not started

---

## Feature 15: Alternatives & Comparison Table
**Scope**: AlternativeStacks (tabbed view) + ComparisonTable (sortable table)
**Files**: `frontend/src/components/results/AlternativeStacks.tsx`, `frontend/src/components/results/ComparisonTable.tsx`
**Test**: Tabs switch categories, table sorts by columns, recommended row highlighted
**Status**: [ ] Not started

---

## Feature 16: Trade-off Radar Chart
**Scope**: TradeoffChart using Recharts RadarChart — compare technologies across dimensions
**Files**: `frontend/src/components/results/TradeoffChart.tsx`
**Test**: Radar chart renders with overlaid polygons for 2-3 technologies
**Status**: [ ] Not started

---

## Feature 17: Scenario Planning Panel
**Scope**: ScenarioPanel — "What if..." input, before/after comparison display
**Files**: `frontend/src/components/results/ScenarioPanel.tsx`
**Test**: Submit scenario query → comparison cards appear with impact summary
**Status**: [ ] Not started

---

## Feature 18: Evaluation Dashboard Layout
**Scope**: Wire all components into the evaluation page — split layout (chat left, results right), progress indicators
**Files**: `frontend/src/app/evaluate/page.tsx`, `frontend/src/components/layout/Sidebar.tsx`
**Test**: Full dashboard renders with chat panel, recommendation cards, alternatives, chart
**Status**: [ ] Not started

---

## Feature 19: Backend Unit Tests
**Scope**: pytest setup, test schemas (Pydantic validation), test session store (CRUD), test tools (mock httpx), test prompts (keyword checks)
**Files**: `backend/pytest.ini`, `backend/tests/__init__.py`, `backend/tests/unit/test_schemas.py`, `backend/tests/unit/test_session.py`, `backend/tests/unit/test_tools.py`, `backend/tests/unit/test_prompts.py`
**Test**: `cd backend && pytest tests/unit/ -v` → all ~20 tests pass
**Status**: [ ] Not started

---

## Feature 20: Backend Integration Tests
**Scope**: Test REST API routes (httpx AsyncClient), test WebSocket endpoint (connect, send, receive, disconnect), test orchestrator with mocked Claude SDK
**Files**: `backend/tests/integration/test_api_routes.py`, `backend/tests/integration/test_websocket.py`, `backend/tests/integration/test_orchestrator.py`
**Test**: `cd backend && pytest tests/integration/ -v` → all ~15 tests pass
**Status**: [ ] Not started

---

## Feature 21: Frontend Unit Tests
**Scope**: Jest + React Testing Library setup, test Zustand store, test all 7 components (RequirementsForm, CriteriaSliders, MessageBubble, ApprovalGate, RecommendationCard, ComparisonTable, TradeoffChart)
**Files**: `frontend/jest.config.ts`, `frontend/src/__tests__/setup.ts`, `frontend/src/__tests__/unit/evaluationStore.test.ts`, `frontend/src/__tests__/unit/components/*.test.tsx`
**Test**: `cd frontend && npm test -- --testPathPattern=unit` → all ~25 tests pass
**Status**: [ ] Not started

---

## Feature 22: Frontend Integration Tests
**Scope**: Test ChatPanel (messages + approval inline), test EvaluatePage (split layout + data flow), test LandingPage (form → API → navigate)
**Files**: `frontend/src/__tests__/integration/ChatPanel.test.tsx`, `frontend/src/__tests__/integration/EvaluatePage.test.tsx`, `frontend/src/__tests__/integration/LandingPage.test.tsx`
**Test**: `cd frontend && npm test -- --testPathPattern=integration` → all ~10 tests pass
**Status**: [ ] Not started

---

## Feature 23: System / E2E Tests
**Scope**: Backend E2E (full evaluation flow with real API key, marked `@pytest.mark.system`), Frontend WebSocket hook test (mock WS server)
**Files**: `backend/tests/system/test_e2e_flow.py`, `frontend/src/__tests__/system/useWebSocket.test.ts`
**Test**: Backend: `pytest -m system`, Frontend: `npm test -- --testPathPattern=system`
**Status**: [ ] Not started

---

## Feature 24: End-to-End Integration & Polish
**Scope**: Full flow test, loading states, error handling, connection status banner, responsive layout
**Test**: Complete flow: fill form → chat → evaluate → approve → scenario plan
**Status**: [ ] Not started

---

## Feature 25: Dockerization
**Scope**: Dockerfiles for backend + frontend, docker-compose.yml for local dev, .dockerignore files
**Files**: `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`, `.dockerignore`
**Test**: `docker compose up --build` → both services start, frontend connects to backend via WebSocket
**Status**: [ ] Not started

---

## Feature 26: GitHub Repo & CI/CD
**Scope**: Initialize git repo, .gitignore, GitHub Actions workflows for CI (lint/test/build) and CD (deploy)
**Files**: `.gitignore`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
**Test**: Push to GitHub → CI workflow runs and passes → Docker images build successfully
**Status**: [ ] Not started

---

## Feature 27: AWS Deployment (ECS Fargate + ALB)
**Scope**: Provision AWS resources — ECR repos, ECS cluster, task definitions, ALB with WebSocket config (300s idle timeout), security groups. Deploy via GitHub Actions.
**Files**: Update `.github/workflows/deploy.yml` with ECR push + ECS update
**Test**: Push to main → images deploy to ECS → app accessible via ALB URL → WebSocket works over wss://
**Status**: [ ] Not started
