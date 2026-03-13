"""
Campaia Engine - FastAPI Application

Main entry point for the Campaia API.
"""

from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.core.database import close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    
    Handles startup and shutdown events.
    """
    # Startup
    print(f"🚀 Starting {settings.app_name} v{settings.app_version}")
    print(f"📝 Environment: {settings.environment}")
    print(f"🔧 Debug mode: {settings.debug}")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down...")
    await close_db()


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered marketing platform for SMBs",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router)


# Root endpoint
@app.get("/")
def root():
    """Root endpoint - API info."""
    return {
        "message": "Campaia API running 🚀",
        "version": settings.app_version,
        "docs": "/docs" if settings.debug else "disabled",
    }


# Health check endpoint (outside API prefix for load balancers)
@app.get("/health")
def health():
    """Health check endpoint for Docker/Kubernetes."""
    return {"status": "healthy"}


@app.get("/ready")
async def ready():
    """
    Readiness check endpoint.
    
    Checks if the application is ready to serve requests.
    Can be extended to check database connectivity, etc.
    """
    # TODO: Add database connectivity check
    return {"status": "ready"}


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=settings.debug,
    )
