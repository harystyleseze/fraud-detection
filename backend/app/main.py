"""
main.py — FastAPI application entry point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers.fraud import router as fraud_router

settings = get_settings()

# lifespan - startup and shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP
    print(f"[startup] {settings.APP_NAME} v{settings.APP_VERSION} ({settings.APP_ENV})")
    print(f"[startup] Database: {settings.DATABASE_URL}")
    init_db()
    print("[startup] Database tables ready")
    yield
    # SHUTDOWN
    print("[shutdown] Goodbye")


# App Initialization
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Analyses financial transaction logs and flags suspicious activity "
        "based on three behavioural fraud detection rules."
    ),
    # Swagger UI: http://localhost:8000/docs
    docs_url="/docs",
    # ReDoc:      http://localhost:8000/redoc
    redoc_url="/redoc",
    lifespan=lifespan,
)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routers
app.include_router(fraud_router, prefix="/api/v1")

# Root Route
@app.get("/", tags=["System"], summary="Root — API info")
def root():
    """Quick confirmation the API is reachable, with links to docs."""
    return {
        "name":    settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs":    "/docs",
        "health":  "/api/v1/health",
    }