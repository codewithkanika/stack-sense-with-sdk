# StackAdvisor – AI Agent for Tech Stack Evaluation

## Context

Building an AI-powered tech stack advisor that helps teams choose the right technology stack for new products or migrations. The agent evaluates requirements, compares options across frontend/backend/database/infrastructure, and provides tailored recommendations with justifications.

**Framework**: Claude Agent SDK (Python) — Anthropic's native agent framework. No LangChain, LangGraph, or CrewAI. The SDK provides its own agent loop, subagent orchestration, tool use (MCP), human-in-the-loop callbacks, and streaming — all built natively for Claude.

**Stack**: Python (FastAPI) backend + Next.js (Tailwind) frontend + WebSocket real-time communication.

---

## Project Structure

```
stack-sense-with-sdk/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app entry point
│   │   ├── config.py                  # Settings & env config
│   │   ├── agent/
│   │   │   ├── __init__.py
│   │   │   ├── orchestrator.py        # Main agent orchestrator (CORE)
│   │   │   ├── subagents.py           # Subagent definitions & prompts
│   │   │   ├── tools.py              # Custom MCP tools
│   │   │   └── prompts.py            # System prompts for all agents
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── websocket.py           # WebSocket handlers
│   │   │   └── routes.py             # REST endpoints
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── schemas.py            # Pydantic models
│   │   │   └── session.py            # In-memory session store
│   │   └── services/
│   │       ├── __init__.py
│   │       └── evaluation.py         # Evaluation result processing
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Landing/input page
│   │   │   ├── globals.css
│   │   │   └── evaluate/
│   │   │       └── page.tsx           # Evaluation dashboard
│   │   ├── components/
│   │   │   ├── input/
│   │   │   │   ├── RequirementsForm.tsx
│   │   │   │   └── CriteriaSliders.tsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatPanel.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   └── ApprovalGate.tsx
│   │   │   ├── results/
│   │   │   │   ├── RecommendationCard.tsx
│   │   │   │   ├── AlternativeStacks.tsx
│   │   │   │   ├── ComparisonTable.tsx
│   │   │   │   ├── TradeoffChart.tsx
│   │   │   │   └── ScenarioPanel.tsx
│   │   │   └── layout/
│   │   │       ├── Header.tsx
│   │   │       └── Sidebar.tsx
│   │   ├── hooks/
│   │   │   └── useWebSocket.ts
│   │   ├── store/
│   │   │   └── evaluationStore.ts     # Zustand state management
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── next.config.ts
├── docs/
│   └── architecture.md               # Saved architecture reference
└── README.md
```

---

## Phase 1: Project Setup & Scaffolding

### Spec

**Goal**: Get both backend and frontend running with basic connectivity.

**Backend setup**:
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install claude-agent-sdk fastapi "uvicorn[standard]" websockets pydantic python-dotenv httpx
```

**Files to create**:

`backend/app/main.py`:
- FastAPI app with CORS middleware (allow localhost:3000)
- Mount WebSocket and REST routers
- Health check endpoint at `/health`
- Startup event to validate ANTHROPIC_API_KEY exists

`backend/app/config.py`:
- Pydantic Settings class loading from `.env`
- Fields: ANTHROPIC_API_KEY, HOST, PORT, ALLOWED_ORIGINS

`backend/.env.example`:
```
ANTHROPIC_API_KEY=your-key-here
HOST=0.0.0.0
PORT=8000
```

**Frontend setup**:
```bash
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir
cd frontend
npm install zustand recharts lucide-react
```

**Acceptance criteria**:
- `uvicorn app.main:app --reload` starts on :8000, `/health` returns `{"status": "ok"}`
- `npm run dev` starts on :3000, renders a page
- No CORS errors when frontend fetches `/health`

---

## Phase 2: Data Models & Schemas

### Spec

**File**: `backend/app/models/schemas.py`

```python
# Core input model
class ProjectRequirements(BaseModel):
    project_description: str
    project_type: str               # "web_app", "mobile_app", "api_service", "data_pipeline", "e_commerce", "saas", "ml_platform", "iot", "cli_tool", "library"
    expected_users: str             # "< 1K", "1K-100K", "100K-1M", "1M-10M", "10M+"
    budget: str                     # "bootstrap", "startup", "mid_range", "enterprise"
    team_size: int
    team_experience: str            # "junior", "mid", "senior", "mixed"
    language_preferences: list[str] # ["python", "typescript", "go", ...]
    compliance_needs: list[str]     # ["HIPAA", "SOC2", "GDPR", "PCI-DSS", ...]
    timeline: str                   # "1_month", "3_months", "6_months", "12_months"
    existing_stack: str | None      # Current tech if migrating
    priorities: dict[str, int]      # {"scalability": 8, "cost": 6, "dx": 9, "performance": 7, "security": 8}

# Recommendation output
class TechRecommendation(BaseModel):
    category: str                   # "frontend", "backend", "database", "infrastructure", "cache", "search"
    technology: str                 # "React", "PostgreSQL", etc.
    confidence: float               # 0.0 - 1.0
    justification: str
    pros: list[str]
    cons: list[str]
    monthly_cost_estimate: str | None
    learning_curve: str             # "low", "medium", "high"
    community_score: str            # "small", "growing", "large", "massive"

class StackRecommendation(BaseModel):
    primary: list[TechRecommendation]
    alternatives: dict[str, list[TechRecommendation]]  # category -> alternatives
    overall_justification: str
    estimated_monthly_cost: str
    scalability_assessment: str
    risk_factors: list[str]

# WebSocket message types
class WSMessage(BaseModel):
    type: str                       # See message types below
    payload: dict
    session_id: str
    timestamp: datetime

# Approval gate
class ApprovalRequest(BaseModel):
    id: str
    title: str
    description: str
    proposed_stack: StackRecommendation
    options: list[str]              # ["approve", "modify", "reject"]

class ApprovalResponse(BaseModel):
    request_id: str
    decision: str                   # "approve", "modify", "reject"
    feedback: str | None
```

**WebSocket message types**:
| Direction | Type | Description |
|-----------|------|-------------|
| Client→Server | `user_message` | Chat message from user |
| Client→Server | `start_evaluation` | Trigger evaluation with requirements |
| Client→Server | `approval_response` | User's approval decision |
| Client→Server | `scenario_query` | "What if..." question |
| Server→Client | `agent_message` | Agent's chat response |
| Server→Client | `agent_thinking` | Agent's reasoning (progress) |
| Server→Client | `approval_request` | Agent requests approval |
| Server→Client | `recommendation` | Stack recommendation data |
| Server→Client | `progress_update` | Evaluation progress (which subagent is running) |
| Server→Client | `evaluation_complete` | Final results ready |
| Server→Client | `error` | Error message |

**File**: `frontend/src/types/index.ts` — TypeScript interfaces mirroring the above schemas.

---

## Phase 3: Agent Backend (Core)

### Spec

This is the most critical phase. Three key files.

### 3a. Custom MCP Tools — `backend/app/agent/tools.py`

```python
from claude_agent_sdk import tool, create_sdk_mcp_server

@tool("search_tech_benchmarks", "Search for latest performance benchmarks for a technology",
      {"technology": str, "benchmark_type": str})
async def search_tech_benchmarks(args):
    # Returns structured benchmark data
    # Uses WebSearch internally via the agent, but this tool formats the query
    pass

@tool("get_github_stats", "Get GitHub repository statistics for a technology",
      {"repo_owner": str, "repo_name": str})
async def get_github_stats(args):
    # Uses httpx to call GitHub API
    # Returns: stars, forks, open_issues, last_commit, contributors, weekly_commits
    pass

@tool("compare_cloud_pricing", "Compare pricing across cloud providers for a service type",
      {"service_type": str, "usage_tier": str})
async def compare_cloud_pricing(args):
    # Fetches and compares AWS vs GCP vs Azure pricing
    pass

@tool("generate_comparison_matrix", "Generate a structured comparison matrix",
      {"technologies": list, "criteria": list})
async def generate_comparison_matrix(args):
    # Structures data into a comparison-ready format
    pass

@tool("request_user_approval", "Request human approval for a recommendation",
      {"title": str, "description": str, "recommendation": dict})
async def request_user_approval(args):
    # Sends approval gate to frontend via callback mechanism
    # Blocks until user responds (approve/modify/reject)
    pass

tech_tools_server = create_sdk_mcp_server(
    name="stack-advisor-tools",
    version="1.0.0",
    tools=[search_tech_benchmarks, get_github_stats, compare_cloud_pricing,
           generate_comparison_matrix, request_user_approval]
)
```

### 3b. Subagent Definitions — `backend/app/agent/subagents.py`

Each subagent definition includes:
- `description`: What the agent does (for the orchestrator to know when to use it)
- `prompt`: Detailed system prompt with evaluation rubric
- `tools`: Allowed tools for this subagent

**requirements-analyzer**:
- Prompt: "You analyze project requirements. Extract structured information: project type, scale, budget, compliance needs, team capabilities. Ask clarifying questions if requirements are ambiguous."
- Tools: [WebSearch]
- Output: Structured ProjectRequirements JSON

**frontend-evaluator**:
- Prompt: "You are a frontend technology expert. Evaluate frameworks (React, Vue, Angular, Svelte, Solid, etc.) against given requirements. Consider: bundle size, SSR support, mobile readiness, learning curve, ecosystem maturity, hiring pool. Use web search for latest benchmarks and community data. Return structured evaluation."
- Tools: [WebSearch, WebFetch, mcp__stack-advisor-tools__get_github_stats, mcp__stack-advisor-tools__search_tech_benchmarks]

**backend-evaluator**:
- Prompt: "You are a backend/language expert. Evaluate languages and frameworks (Node/Express, Python/FastAPI, Go/Gin, Rust/Axum, Java/Spring, .NET, etc.) against requirements. Consider: performance benchmarks, concurrency model, ecosystem, deployment options, hiring pool."
- Tools: [WebSearch, WebFetch, mcp__stack-advisor-tools__get_github_stats, mcp__stack-advisor-tools__search_tech_benchmarks]

**database-evaluator**:
- Prompt: "You are a database expert. Evaluate databases (PostgreSQL, MySQL, MongoDB, DynamoDB, Redis, Cassandra, etc.) against requirements. Consider: query patterns, scaling model (vertical vs horizontal), ACID compliance, cost at scale, operational complexity."
- Tools: [WebSearch, WebFetch, mcp__stack-advisor-tools__search_tech_benchmarks, mcp__stack-advisor-tools__compare_cloud_pricing]

**infrastructure-evaluator**:
- Prompt: "You are an infrastructure and deployment expert. Evaluate cloud platforms (AWS, GCP, Azure, Vercel, Railway, Fly.io, etc.), on-premises solutions (Kubernetes on bare metal, Docker Swarm, VMware, OpenStack), and hybrid approaches. Consider: managed services, pricing at scale, compliance certifications, data sovereignty requirements, global availability, DX, and whether on-prem is mandated by compliance (HIPAA, government, air-gapped environments)."
- Tools: [WebSearch, WebFetch, mcp__stack-advisor-tools__compare_cloud_pricing]

**scenario-planner**:
- Prompt: "You analyze 'what-if' scenarios for tech stack changes. Given a current recommendation and a proposed change, evaluate the impact on cost, performance, scalability, and team productivity. Provide clear before/after comparison."
- Tools: [WebSearch, WebFetch, all custom tools]

### 3c. Orchestrator — `backend/app/agent/orchestrator.py`

```python
class EvaluationOrchestrator:
    def __init__(self, session_id: str, ws_send_callback):
        self.session_id = session_id
        self.ws_send = ws_send_callback  # async fn to send messages to frontend
        self.client = None
        self.approval_event = asyncio.Event()
        self.approval_response = None

    async def initialize(self):
        """Set up Claude SDK client with tools and subagents."""
        self.client = ClaudeSDKClient(
            options=ClaudeAgentOptions(
                allowed_tools=["Read", "WebSearch", "WebFetch", "Task",
                               "mcp__stack-advisor-tools__*"],
                mcp_servers={"stack-advisor-tools": tech_tools_server},
                agents=get_subagent_definitions(),  # from subagents.py
                system_prompt=ORCHESTRATOR_SYSTEM_PROMPT,
                permission_mode="default",
                can_use_tool=self._approval_gate,
            )
        )

    async def _approval_gate(self, tool_name, tool_input, context):
        """Human-in-the-loop: intercept approval requests."""
        if tool_name == "mcp__stack-advisor-tools__request_user_approval":
            # Send approval request to frontend
            await self.ws_send({
                "type": "approval_request",
                "payload": tool_input
            })
            # Wait for user response
            self.approval_event.clear()
            await self.approval_event.wait()
            return self.approval_response.decision == "approve"
        return True  # Auto-approve other tools

    async def handle_approval_response(self, response: ApprovalResponse):
        """Called when user responds to an approval gate."""
        self.approval_response = response
        self.approval_event.set()

    async def evaluate(self, requirements: ProjectRequirements):
        """Main evaluation flow — streams messages to frontend."""
        prompt = f"Evaluate tech stack for: {requirements.model_dump_json()}"
        async for message in self.client.send(prompt):
            await self._route_message(message)

    async def handle_chat(self, user_message: str):
        """Handle ongoing chat messages."""
        async for message in self.client.send(user_message):
            await self._route_message(message)

    async def _route_message(self, message):
        """Route SDK messages to appropriate frontend message types."""
        # Map AssistantMessage → agent_message
        # Map ThinkingBlock → agent_thinking
        # Map ToolUseBlock for Task → progress_update
        # Map ResultMessage → evaluation_complete
        pass
```

**Orchestrator system prompt** (`backend/app/agent/prompts.py`):
```
You are StackAdvisor, an expert AI agent that evaluates technology stacks.

WORKFLOW:
1. Receive project requirements from the user
2. Use the requirements-analyzer subagent to parse and clarify requirements
3. Ask the user any clarifying questions before proceeding
4. WAIT for user confirmation before starting evaluation
5. Dispatch ONLY RELEVANT evaluator subagents IN PARALLEL based on project type:
   - frontend-evaluator — SKIP for data_pipeline, ml_platform, cli_tool, library, api_service (unless user requests)
   - backend-evaluator — always include
   - database-evaluator — always include (unless project has no data persistence needs)
   - infrastructure-evaluator — always include (covers cloud, on-prem, and hybrid)
   For example: a data engineering project gets backend + database + infrastructure only.
6. Collect all results and synthesize a unified recommendation
7. Present the recommendation using request_user_approval tool
8. If user modifies or rejects, adjust and re-evaluate affected components
9. Handle "what if" scenarios via scenario-planner subagent

OUTPUT FORMAT:
Always structure recommendations as JSON matching the StackRecommendation schema.
Include confidence scores, justifications, pros/cons for every technology choice.
Compare at least 2 alternatives per category.
```

### 3d. Session Management — `backend/app/models/session.py`

```python
class SessionStore:
    """In-memory session store (swap for Redis/DB in production)."""
    sessions: dict[str, SessionData] = {}

    def create(self, requirements: ProjectRequirements | None) -> str
    def get(self, session_id: str) -> SessionData | None
    def update(self, session_id: str, **kwargs) -> None
    def save_result(self, session_id: str, result: StackRecommendation) -> None

class SessionData(BaseModel):
    id: str
    requirements: ProjectRequirements | None
    messages: list[dict]
    recommendations: StackRecommendation | None
    status: str  # "input", "evaluating", "awaiting_approval", "completed"
    created_at: datetime
```

---

## Phase 4: API Layer

### Spec

### WebSocket Handler — `backend/app/api/websocket.py`

```python
@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await websocket.accept()
    orchestrator = EvaluationOrchestrator(
        session_id=session_id,
        ws_send_callback=lambda msg: websocket.send_json(msg)
    )
    await orchestrator.initialize()

    try:
        while True:
            data = await websocket.receive_json()
            match data["type"]:
                case "start_evaluation":
                    requirements = ProjectRequirements(**data["payload"])
                    asyncio.create_task(orchestrator.evaluate(requirements))
                case "user_message":
                    asyncio.create_task(orchestrator.handle_chat(data["payload"]["message"]))
                case "approval_response":
                    response = ApprovalResponse(**data["payload"])
                    await orchestrator.handle_approval_response(response)
                case "scenario_query":
                    asyncio.create_task(orchestrator.handle_chat(
                        f"SCENARIO ANALYSIS: {data['payload']['query']}"
                    ))
    except WebSocketDisconnect:
        session_store.update(session_id, status="disconnected")
```

### REST Routes — `backend/app/api/routes.py`

```python
@router.post("/api/sessions")
async def create_session(req: ProjectRequirements | None = None) -> dict:
    session_id = session_store.create(req)
    return {"session_id": session_id}

@router.get("/api/sessions/{session_id}")
async def get_session(session_id: str) -> SessionData:
    return session_store.get(session_id)

@router.get("/api/sessions/{session_id}/results")
async def get_results(session_id: str) -> StackRecommendation | None:
    session = session_store.get(session_id)
    return session.recommendations if session else None
```

---

## Phase 5: Frontend UI

### Spec

### UI Mockup — Landing Page (`/`)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⚡ StackAdvisor                                          [GitHub] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│              🏗️  Tell us about your project                         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Project Description                                         │   │
│  │ ┌─────────────────────────────────────────────────────────┐ │   │
│  │ │ E-commerce platform for artisan marketplace with        │ │   │
│  │ │ real-time inventory and payment processing...           │ │   │
│  │ └─────────────────────────────────────────────────────────┘ │   │
│  │                                                             │   │
│  │ Project Type        Expected Users       Budget             │   │
│  │ ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │   │
│  │ │ Web App    ▼ │   │ 100K-1M    ▼ │   │ Startup    ▼ │    │   │
│  │ └──────────────┘   └──────────────┘   └──────────────┘    │   │
│  │                                                             │   │
│  │ Team Size: [  5  ]     Team Experience: [ Senior  ▼ ]      │   │
│  │ Timeline:  [ 6 months ▼ ]                                   │   │
│  │                                                             │   │
│  │ Language Preferences                                        │   │
│  │ [✓] TypeScript  [✓] Python  [ ] Go  [ ] Rust  [ ] Java    │   │
│  │                                                             │   │
│  │ Compliance Requirements                                     │   │
│  │ [ ] HIPAA  [✓] GDPR  [✓] SOC2  [ ] PCI-DSS               │   │
│  │                                                             │   │
│  │ Existing Stack (if migrating)                               │   │
│  │ ┌─────────────────────────────────────────────────────────┐ │   │
│  │ │ Currently using PHP/Laravel with MySQL...               │ │   │
│  │ └─────────────────────────────────────────────────────────┘ │   │
│  │                                                             │   │
│  │ ── Priority Weights ──────────────────────────────────────  │   │
│  │                                                             │   │
│  │ Scalability    ████████████████░░░░  8/10                   │   │
│  │ Cost           ██████████████░░░░░░  7/10                   │   │
│  │ Developer Exp  ██████████████████░░  9/10                   │   │
│  │ Performance    ████████████████░░░░  8/10                   │   │
│  │ Security       ██████████████████░░  9/10                   │   │
│  │                                                             │   │
│  │            ┌──────────────────────────┐                     │   │
│  │            │   🚀 Start Evaluation    │                     │   │
│  │            └──────────────────────────┘                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### UI Mockup — Evaluation Dashboard (`/evaluate`)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ⚡ StackAdvisor          Session: #a1b2c3          [New Session] [Save]       │
├──────────────────────────────┬──────────────────────────────────────────────────┤
│                              │                                                  │
│  💬 Chat                     │  📊 Recommended Stack                           │
│  ─────────────               │  ────────────────────                           │
│                              │                                                  │
│  🤖 I've analyzed your      │  ┌─────────────┐ ┌──────────────┐              │
│  requirements. Let me ask    │  │  Frontend    │ │  Backend     │              │
│  a few questions...          │  │  ─────────── │ │  ──────────  │              │
│                              │  │  Next.js     │ │  Python/     │              │
│  🤖 Do you need             │  │  ★★★★☆ 92%  │ │  FastAPI     │              │
│  real-time features like     │  │              │ │  ★★★★☆ 88%  │              │
│  live inventory updates?     │  │  • SSR + SSG │ │              │              │
│                              │  │  • React eco │ │  • Async     │              │
│  👤 Yes, inventory should   │  │  • Vercel    │ │  • ML-ready  │              │
│  update in real-time for     │  │    deploy    │ │  • Fast dev  │              │
│  all users                   │  └─────────────┘ └──────────────┘              │
│                              │                                                  │
│  🤖 Got it. Starting        │  ┌─────────────┐ ┌──────────────┐              │
│  evaluation...               │  │  Database    │ │  Infra       │              │
│                              │  │  ─────────── │ │  ──────────  │              │
│  ┌────────────────────────┐  │  │  PostgreSQL  │ │  AWS         │              │
│  │ ⏳ Evaluating...       │  │  │  ★★★★★ 95% │ │  ★★★★☆ 87%  │              │
│  │ ✅ Frontend: Done      │  │  │              │ │              │              │
│  │ ✅ Backend: Done       │  │  │  • ACID      │ │  • Global    │              │
│  │ 🔄 Database: Running   │  │  │  • JSON + SQL│ │  • SOC2+GDPR │              │
│  │ ⏳ Infrastructure      │  │  │  • Scalable  │ │  • Managed   │              │
│  └────────────────────────┘  │  └─────────────┘ └──────────────┘              │
│                              │                                                  │
│  ┌────────────────────────┐  │  ── Alternatives ─────────────────────────────  │
│  │ 🔔 APPROVAL REQUIRED   │  │                                                  │
│  │                        │  │  [Frontend] [Backend] [Database] [Infra]        │
│  │ Agent recommends:      │  │                                                  │
│  │ Next.js + FastAPI +    │  │  │ Technology │ Score │ Cost  │ Scale │ DX  │  │
│  │ PostgreSQL + AWS       │  │  ├────────────┼───────┼───────┼───────┼─────┤  │
│  │                        │  │  │ Vue/Nuxt   │  85%  │  $$$  │ ★★★★ │ ★★★ │  │
│  │ [✅ Approve]           │  │  │ SvelteKit  │  81%  │  $$   │ ★★★  │ ★★★★│  │
│  │ [✏️ Modify]            │  │  │ Angular    │  74%  │  $$$$ │ ★★★★★│ ★★  │  │
│  │ [❌ Reject]            │  │                                                  │
│  └────────────────────────┘  │  ── Trade-off Radar ───────────────────────────  │
│                              │                                                  │
│  ── Scenario Planning ─────  │       Scalability                               │
│  ┌────────────────────────┐  │           ▲                                     │
│  │ What if we switched    │  │    ██████ │ ██████                              │
│  │ to MongoDB instead?    │  │  Cost ◄───┼───► DX                             │
│  └────────────────────────┘  │    ██████ │ ██████                              │
│                              │           ▼                                     │
│  ┌──────────────┐            │       Performance                               │
│  │ 💬 Type...   │  [Send]   │                                                  │
│  └──────────────┘            │  ■ Next.js  ■ Vue/Nuxt  ■ SvelteKit            │
│                              │                                                  │
├──────────────────────────────┴──────────────────────────────────────────────────┤
│  Estimated monthly cost: ~$450-800  │  Scalability: Up to 5M users  │  Risk: Low│
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Component Specs

**`RequirementsForm.tsx`**:
- Controlled form using React state
- Dropdowns for project_type, expected_users, budget, timeline, team_experience
- Number input for team_size
- Checkbox groups for language_preferences and compliance_needs
- Textarea for project_description and existing_stack
- Validates required fields before submit
- On submit: calls `POST /api/sessions` → gets session_id → navigates to `/evaluate?session={id}`

**`CriteriaSliders.tsx`**:
- Range sliders (1-10) for: scalability, cost, developer_experience, performance, security
- Labels show current value
- Updates parent form state on change

**`ChatPanel.tsx`**:
- Scrollable message list with auto-scroll to bottom
- Renders `MessageBubble` for text messages
- Renders `ApprovalGate` inline when message type is approval_request
- Renders progress indicators for evaluation phases
- Text input + send button at bottom
- Connected to WebSocket via `useWebSocket` hook

**`ApprovalGate.tsx`**:
- Card with colored border (yellow = pending, green = approved, red = rejected)
- Shows recommendation summary
- Three buttons: Approve (green), Modify (yellow), Reject (red)
- Modify opens a text input for feedback
- Sends `approval_response` via WebSocket

**`RecommendationCard.tsx`**:
- Card per category (Frontend, Backend, Database, Infrastructure)
- Shows: technology name, confidence score (progress bar), justification text
- Expandable section for pros/cons list
- Cost estimate and learning curve badges

**`AlternativeStacks.tsx`**:
- Tabbed interface — one tab per category
- Each tab shows a `ComparisonTable` for that category

**`ComparisonTable.tsx`**:
- HTML table with technologies as rows, criteria as columns
- Columns: Technology, Score, Monthly Cost, Scalability, Developer Experience, Learning Curve
- Sortable by any column
- Highlighted row for the recommended choice

**`TradeoffChart.tsx`**:
- Recharts RadarChart component
- Axes: Scalability, Cost Efficiency, DX, Performance, Security, Community
- Overlaid polygons for each technology being compared
- Legend with color coding

**`ScenarioPanel.tsx`**:
- Text input for "What if..." questions
- Before/after comparison cards when scenario results arrive
- Shows impact summary: what changed, what improved, what degraded

### State Management — `evaluationStore.ts`

```typescript
interface EvaluationStore {
  // Connection
  sessionId: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';

  // Chat
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;

  // Evaluation
  phase: 'input' | 'chatting' | 'evaluating' | 'awaiting_approval' | 'completed';
  progress: { frontend: Status; backend: Status; database: Status; infra: Status };

  // Results
  recommendation: StackRecommendation | null;
  setRecommendation: (rec: StackRecommendation) => void;

  // Approvals
  pendingApproval: ApprovalRequest | null;
  setPendingApproval: (req: ApprovalRequest | null) => void;

  // Scenarios
  scenarios: ScenarioResult[];
  addScenario: (s: ScenarioResult) => void;
}
```

### WebSocket Hook — `useWebSocket.ts`

```typescript
function useWebSocket(sessionId: string) {
  // Returns: { send, connectionStatus }
  // On connect: establish WS to ws://localhost:8000/ws/{sessionId}
  // On message: dispatch to evaluationStore based on message.type
  // Auto-reconnect with exponential backoff (1s, 2s, 4s, max 30s)
  // Cleanup on unmount
}
```

---

## Phase 6: Integration & Polish

### Spec

1. Wire frontend WebSocket hook to backend
2. End-to-end smoke test with sample input:
   - Input: "E-commerce platform, 1M users, startup budget, TypeScript preferred, GDPR compliant"
   - Expected: Agent asks clarifying questions → evaluates → presents recommendation → user approves → scenario planning works
3. Loading states: skeleton cards during evaluation, typing indicator in chat
4. Error handling: connection lost banner, retry button, error messages in chat
5. Responsive layout: stack panels vertically on mobile
6. Dark/light theme toggle (Tailwind dark: classes)

---

## Phase 6b: Testing

### Spec

**Goal**: Comprehensive test coverage across unit, integration, and system (E2E) levels.

### Backend Tests (pytest)

**Test dependencies** (add to `requirements.txt`):
```
pytest
pytest-asyncio
pytest-cov
httpx  # already included, used as async test client
```

**Directory**: `backend/tests/`

#### Unit Tests — `backend/tests/unit/`

**`test_schemas.py`** — Validate Pydantic models:
- ProjectRequirements: valid input, missing required fields, invalid enum values, priority weights bounds
- TechRecommendation: confidence score 0-1 range, required fields
- StackRecommendation: primary list not empty, alternatives structure
- ApprovalRequest/Response: valid decisions, invalid decision rejected
- WSMessage: all message types valid, timestamp serialization

**`test_session.py`** — Session store logic:
- create() returns unique ID
- get() returns None for unknown ID
- update() modifies status correctly
- save_result() persists StackRecommendation
- Multiple sessions don't interfere

**`test_tools.py`** — Custom MCP tool functions:
- get_github_stats: mock httpx response, verify parsed output structure
- search_tech_benchmarks: verify query formatting
- compare_cloud_pricing: verify comparison matrix output
- generate_comparison_matrix: verify correct structure with N technologies x M criteria
- request_user_approval: verify it constructs approval payload correctly

**`test_prompts.py`** — Agent prompt construction:
- Orchestrator prompt contains required workflow steps
- Each subagent prompt contains evaluation rubric keywords
- Prompts include output format instructions

#### Integration Tests — `backend/tests/integration/`

**`test_api_routes.py`** — REST API (using httpx AsyncClient + FastAPI TestClient):
- POST /api/sessions → returns session_id (201)
- POST /api/sessions with requirements body → session created with data
- GET /api/sessions/{id} → returns session data (200)
- GET /api/sessions/{unknown_id} → 404
- GET /api/sessions/{id}/results → returns null before evaluation, data after

**`test_websocket.py`** — WebSocket endpoint (using httpx + websockets test client):
- Connect to /ws/{session_id} → connection accepted
- Send user_message → receive agent_message response
- Send invalid JSON → receive error message
- Send unknown message type → graceful handling
- Disconnect → session status updated

**`test_orchestrator.py`** — Agent orchestrator (mock Claude SDK):
- initialize() creates client with correct tools and subagents
- evaluate() streams messages via callback
- handle_chat() sends user message and returns response
- _approval_gate() blocks on approval tool, resumes on response
- _route_message() maps SDK message types to correct WS message types

#### System Tests — `backend/tests/system/`

**`test_e2e_flow.py`** — Full evaluation flow (requires ANTHROPIC_API_KEY, mark with `@pytest.mark.system`):
- Submit requirements → agent asks clarifying questions
- Provide answers → evaluation starts
- Progress updates stream for each subagent
- Recommendation arrives with all required fields populated
- Approval gate triggers and blocks
- Approve → final result returned
- Scenario query → comparison response

### Frontend Tests (Jest + React Testing Library)

**Test dependencies** (add to `package.json` devDependencies):
```json
{
  "@testing-library/react": "^16.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "@testing-library/user-event": "^14.0.0",
  "jest": "^29.0.0",
  "jest-environment-jsdom": "^29.0.0",
  "ts-jest": "^29.0.0"
}
```

**Directory**: `frontend/src/__tests__/`

#### Unit Tests — `frontend/src/__tests__/unit/`

**`evaluationStore.test.ts`** — Zustand store:
- addMessage appends to messages array
- setRecommendation updates recommendation
- setPendingApproval sets/clears approval
- addScenario appends to scenarios
- Phase transitions: input → chatting → evaluating → awaiting_approval → completed

**`components/RequirementsForm.test.tsx`**:
- Renders all form fields
- Validates required fields (description, project type)
- Submit disabled when invalid
- Submit calls onSubmit with correct ProjectRequirements shape

**`components/CriteriaSliders.test.tsx`**:
- Renders 5 sliders with labels
- Slider values update on change
- Values bounded 1-10

**`components/MessageBubble.test.tsx`**:
- Renders user message with correct styling (right-aligned)
- Renders agent message with correct styling (left-aligned)
- Renders thinking/progress message type differently

**`components/ApprovalGate.test.tsx`**:
- Renders recommendation summary
- Three buttons visible: Approve, Modify, Reject
- Clicking Approve calls onResponse with "approve"
- Clicking Modify shows feedback input
- Clicking Reject calls onResponse with "reject"
- Card color changes based on state (pending/approved/rejected)

**`components/RecommendationCard.test.tsx`**:
- Renders technology name and category
- Confidence bar width matches score
- Pros/cons lists render correctly
- Expandable section toggles

**`components/ComparisonTable.test.tsx`**:
- Renders correct number of rows and columns
- Recommended row highlighted
- Click column header sorts data
- Handles empty data gracefully

**`components/TradeoffChart.test.tsx`**:
- Renders RadarChart with correct axes
- Multiple technologies shown as overlaid polygons
- Legend displays technology names

#### Integration Tests — `frontend/src/__tests__/integration/`

**`ChatPanel.test.tsx`**:
- Messages from store render in order
- Typing in input + clicking Send dispatches message
- ApprovalGate renders inline for approval_request messages
- Auto-scrolls to bottom on new message
- Progress indicator shows during evaluation phase

**`EvaluatePage.test.tsx`**:
- Renders split layout (chat left, results right)
- Recommendation cards populate when store has data
- Alternative tabs switch content
- Scenario panel sends query

**`LandingPage.test.tsx`**:
- Form renders with all fields
- Submit creates session via API (mock fetch)
- Navigates to /evaluate?session={id} on success
- Shows error on API failure

#### System Tests — `frontend/src/__tests__/system/`

**`useWebSocket.test.ts`** (using mock WebSocket server):
- Connects to correct URL
- Dispatches messages to store by type
- Reconnects on disconnect with exponential backoff
- send() transmits JSON correctly
- Cleans up on unmount

### Test Configuration

**Backend** — `backend/pytest.ini`:
```ini
[pytest]
asyncio_mode = auto
testpaths = tests
markers =
    system: System tests requiring real API keys (deselect with -m "not system")
```

Run: `cd backend && pytest` (unit + integration), `pytest -m system` (E2E)

**Frontend** — `frontend/jest.config.ts`:
```typescript
export default {
  testEnvironment: 'jsdom',
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFilesAfterSetup: ['<rootDir>/src/__tests__/setup.ts'],
}
```

Run: `cd frontend && npm test`

### Test Summary

| Layer | Backend | Frontend | Total |
|-------|---------|----------|-------|
| Unit | ~20 tests (schemas, session, tools, prompts) | ~25 tests (store, 7 components) | ~45 |
| Integration | ~15 tests (API, WebSocket, orchestrator) | ~10 tests (pages, chat panel) | ~25 |
| System | ~7 tests (full E2E flow) | ~5 tests (WebSocket hook) | ~12 |
| **Total** | **~42** | **~40** | **~82** |

---

## Dependencies

**Backend (`requirements.txt`)**:
```
claude-agent-sdk
fastapi
uvicorn[standard]
websockets
pydantic>=2.0
python-dotenv
httpx
pytest
pytest-asyncio
pytest-cov
```

**Frontend (`package.json` dependencies)**:
```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "tailwindcss": "^4.0.0",
  "zustand": "^5.0.0",
  "recharts": "^2.15.0",
  "lucide-react": "^0.470.0"
}
```

**Frontend (`package.json` devDependencies)**:
```json
{
  "@testing-library/react": "^16.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "@testing-library/user-event": "^14.0.0",
  "jest": "^29.0.0",
  "jest-environment-jsdom": "^29.0.0",
  "ts-jest": "^29.0.0"
}
```

---

## Phase 7: Dockerization & Local Docker Compose

### Spec

**Goal**: Containerize both services for consistent dev/deploy environments.

**Files to create**:

`backend/Dockerfile`:
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app/
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

`frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json .
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

`docker-compose.yml` (project root):
```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: ./backend/.env
    volumes:
      - ./backend/app:/app/app  # hot reload in dev
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_WS_URL=ws://localhost:8000
    depends_on:
      - backend
```

**Test**: `docker compose up --build` → both services start, frontend talks to backend via WS.

---

## Phase 8: GitHub Setup & CI/CD

### Spec

**Goal**: Version control + automated testing and deployment pipeline.

**Files to create**:

`.gitignore`:
```
# Python
backend/venv/
__pycache__/
*.pyc
backend/.env

# Node
frontend/node_modules/
frontend/.next/
frontend/.env.local

# Docker
.docker/
```

`.github/workflows/ci.yml` — runs on every push/PR:
- Lint + test backend (pytest)
- Lint + build frontend (npm run lint && npm run build)
- Build Docker images (verify they compile)

`.github/workflows/deploy.yml` — runs on push to `main`:
- Build Docker images
- Push to AWS ECR
- Update ECS Fargate services
- Wait for stable deployment

**GitHub Secrets needed**:
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ACCOUNT_ID`
- `ANTHROPIC_API_KEY` (for backend container)

---

## Phase 9: AWS Deployment (ECS Fargate + ALB)

### Spec

**Architecture**:
```
Internet → ALB (HTTPS/WSS) → ECS Fargate Cluster
                                ├── Backend Service (FastAPI :8000)
                                └── Frontend Service (Next.js :3000)
```

**Why ECS Fargate**: App Runner does NOT support WebSocket. Fargate is the best fit for this app.

**AWS Resources to provision**:
1. **ECR**: 2 repositories (stack-advisor-backend, stack-advisor-frontend)
2. **ECS Cluster**: 1 Fargate cluster
3. **Task Definitions**: 2 (backend: 0.5 vCPU/1GB, frontend: 0.25 vCPU/0.5GB)
4. **ECS Services**: 2 services with desired count 1 (auto-scale later)
5. **ALB**: 1 Application Load Balancer
   - Listener rule: `/api/*` and `/ws/*` → backend target group
   - Default → frontend target group
   - **Idle timeout: 300s** (critical for WebSocket)
6. **Security Groups**: ALB (80/443 inbound), ECS (8000/3000 from ALB only)
7. **VPC**: Default VPC with public subnets is fine for demo

**Critical WebSocket config**:
- ALB idle timeout: **300 seconds** (default 60s will drop WS connections)
- Implement client-side ping every 30s to keep connections alive
- Backend WebSocket handler must handle ping/pong

**Cost estimate (demo/dev)**: ~$45-65/month (Fargate + ALB + ECR)

**Deployment approach**: Can be done via:
- AWS Console (manual, for first setup)
- AWS CDK (recommended for reproducibility) — add later
- GitHub Actions workflow handles ongoing deploys

---

## MCP Servers

Enable these for development workflow:

```bash
# GitHub — official, for repo/PR/issue management
claude mcp add-json github '{"type":"http","url":"https://api.githubcopilot.com/mcp","headers":{"Authorization":"Bearer YOUR_GITHUB_PAT"}}'

# AWS — official, for infrastructure management
claude mcp add awslabs.core-mcp-server -s user -e FASTMCP_LOG_LEVEL=ERROR -- uvx awslabs.core-mcp-server@latest
```

---

## Verification Plan

1. **Backend startup**: `cd backend && uvicorn app.main:app --reload` → port 8000, `/health` returns OK
2. **Frontend startup**: `cd frontend && npm run dev` → port 3000, renders landing page
3. **WebSocket test**: Browser console → `new WebSocket("ws://localhost:8000/ws/test")` → connection established
4. **Form submission**: Fill requirements form → submit → redirects to `/evaluate` → WebSocket connects
5. **Agent chat**: Type message → agent responds → messages appear in chat
6. **Evaluation flow**: Click "Start Evaluation" → progress updates stream → recommendations appear in cards
7. **Approval gate**: Approval card appears → click Approve → agent acknowledges → results finalize
8. **Scenario planning**: Type "What if we use MongoDB instead?" → comparison appears
9. **Full E2E**: Run complete flow with "E-commerce platform for artisan marketplace" scenario
