import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.schemas import ProjectRequirements, StackRecommendation


class SessionData(BaseModel):
    """Represents a single evaluation session."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    requirements: ProjectRequirements | None = None
    messages: list[dict] = Field(default_factory=list)
    recommendations: StackRecommendation | None = None
    status: str = "input"  # "input", "evaluating", "awaiting_approval", "completed"
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SessionStore:
    """In-memory session store."""

    def __init__(self) -> None:
        self._sessions: dict[str, SessionData] = {}

    def create(self, requirements: ProjectRequirements | None = None) -> str:
        session = SessionData(requirements=requirements)
        self._sessions[session.id] = session
        return session.id

    def get(self, session_id: str) -> SessionData | None:
        return self._sessions.get(session_id)

    def update(self, session_id: str, **kwargs) -> None:
        session = self._sessions.get(session_id)
        if session:
            for k, v in kwargs.items():
                setattr(session, k, v)

    def save_result(self, session_id: str, result: StackRecommendation) -> None:
        session = self._sessions.get(session_id)
        if session:
            session.recommendations = result
            session.status = "completed"

    def list_all(self) -> list[SessionData]:
        return list(self._sessions.values())


session_store = SessionStore()
