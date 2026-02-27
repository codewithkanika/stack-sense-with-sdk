import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.api.websocket import router as ws_router
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="StackAdvisor API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(api_router)
app.include_router(ws_router)


@app.on_event("startup")
async def startup_event():
    logger.info(
        "StackAdvisor API started (Bedrock model: %s, region: %s)",
        settings.BEDROCK_MODEL_ID,
        settings.AWS_REGION,
    )


@app.get("/health")
async def health_check():
    return {"status": "ok"}
