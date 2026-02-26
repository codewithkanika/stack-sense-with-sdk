from fastapi import APIRouter, HTTPException

from app.models.session import SessionData, session_store

from app.models.schemas import ProjectRequirements, StackRecommendation

router = APIRouter()


@router.post("/api/sessions")
async def create_session(req: ProjectRequirements | None = None) -> dict:
    """Create a new evaluation session, optionally with initial requirements."""
    session_id = session_store.create(req)
    return {"session_id": session_id}


@router.get("/api/sessions/{session_id}")
async def get_session(session_id: str) -> SessionData:
    """Retrieve a session by its ID."""
    session = session_store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/api/sessions/{session_id}/results")
async def get_results(session_id: str) -> StackRecommendation | None:
    """Retrieve recommendations for a completed session."""
    session = session_store.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.recommendations
