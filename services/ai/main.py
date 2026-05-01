"""
DevFlow AI — Python FastAPI service
Wraps Anthropic Claude API for code review and documentation generation.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

from app.endpoints.review import router as review_router
from app.endpoints.docs import router as docs_router
from app.config import settings

# Configure structured logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="DevFlow AI Service",
    description="AI-powered code review and documentation generation using Claude",
    version="1.0.0",
)

# CORS — only allow the API backend service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://api:3001"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "devflow-ai", "model": settings.claude_model}


app.include_router(review_router)
app.include_router(docs_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.log_level == "DEBUG",
    )
