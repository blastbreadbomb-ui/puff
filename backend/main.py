"""
AI 知心大姐姐 — FastAPI 后端入口

Starts the FastAPI server with all API routes.
Run with: uvicorn main:app --host 127.0.0.1 --port 8899
"""

import sys
import os
from pathlib import Path

# Force UTF-8 encoding for stdout on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import settings
from models.database import init_db

# Import and include routers
from api.health import router as health_router
from api.chat import router as chat_router
from api.emotion import router as emotion_router
from api.memory import router as memory_router

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="24小时在线、懂心理学、无评判的温柔树洞与情绪疗愈师",
)

# CORS middleware — enabled when frontend is on a different origin
# (Netlify → Render) or in debug mode. Disabled in single-service production.
_cors_origins = settings.cors_origins
if settings.debug or _cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins.split(",") if _cors_origins else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register routers
app.include_router(health_router)
app.include_router(chat_router)
app.include_router(emotion_router)
app.include_router(memory_router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    init_db()
    print(f"🌸 {settings.app_name} v{settings.app_version} started")
    print(f"📂 Database: {settings.db_path}")


# Serve the built frontend in production (must come after API routes)
STATIC_DIR = Path(__file__).parent.parent / "dist-web"
if STATIC_DIR.exists() and STATIC_DIR.is_dir():
    # Mount static files — this handles "/" by serving index.html
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
else:
    # No built frontend: expose a simple root endpoint for health/status
    @app.get("/")
    async def root():
        """Root endpoint (API-only mode)."""
        return {
            "name": settings.app_name,
            "version": settings.app_version,
            "description": "AI 知心大姐姐 — 温柔的情绪陪伴者",
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
