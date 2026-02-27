from pydantic import BaseModel
from datetime import datetime


class ProjectRequirements(BaseModel):
    project_description: str
    project_type: str  # "web_app", "mobile_app", "api_service", "data_pipeline", "e_commerce", "saas", "ml_platform", "iot", "cli_tool", "library"
    expected_users: str  # "< 1K", "1K-100K", "100K-1M", "1M-10M", "10M+"
    budget: str  # "bootstrap", "startup", "mid_range", "enterprise"
    team_size: int
    team_experience: str  # "junior", "mid", "senior", "mixed"
    language_preferences: list[str]  # ["python", "typescript", "go", ...]
    compliance_needs: list[str]  # ["HIPAA", "SOC2", "GDPR", "PCI-DSS", ...]
    timeline: str  # "1_month", "3_months", "6_months", "12_months"
    existing_stack: str | None = None
    priorities: dict[str, int]  # {"scalability": 8, "cost": 6, "dx": 9, "performance": 7, "security": 8}


class TechRecommendation(BaseModel):
    category: str  # "frontend", "backend", "database", "infrastructure", "cache", "search"
    technology: str  # "React", "PostgreSQL", etc.
    confidence: float  # 0.0 - 1.0
    justification: str
    pros: list[str]
    cons: list[str]
    monthly_cost_estimate: str | None = None
    learning_curve: str  # "low", "medium", "high"
    community_score: str  # "small", "growing", "large", "massive"


class StackRecommendation(BaseModel):
    primary: list[TechRecommendation]
    alternatives: dict[str, list[TechRecommendation]]  # category -> alternatives
    overall_justification: str
    estimated_monthly_cost: str
    scalability_assessment: str
    risk_factors: list[str]


class WSMessage(BaseModel):
    type: str
    payload: dict
    session_id: str
    timestamp: datetime


class ApprovalRequest(BaseModel):
    id: str
    title: str
    description: str
    proposed_stack: StackRecommendation
    options: list[str] = ["approve", "modify", "reject"]


class ApprovalResponse(BaseModel):
    request_id: str | None = None
    decision: str  # "approve", "modify", "reject"
    feedback: str | None = None
