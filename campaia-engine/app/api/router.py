"""
Campaia Engine - Main API Router

Aggregates all route modules under /api/v1 prefix.
"""

from fastapi import APIRouter

from app.api.routes import ai, auth, campaigns, payments, users, video, targeting, invoices, tiktok, agent, scheduler

# Create main router with API version prefix
api_router = APIRouter(prefix="/api/v1")

# Include route modules
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["Campaigns"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Generation"])
api_router.include_router(video.router, tags=["Video Generation"])
api_router.include_router(targeting.router, tags=["Targeting"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
api_router.include_router(tiktok.router, tags=["TikTok Integration"])
api_router.include_router(agent.router, tags=["Campaia Agent"])
api_router.include_router(scheduler.router, tags=["Campaign Scheduler"])

# Future routes (uncomment as they are created)


# API health check
@api_router.get("/health", tags=["Health"])
async def api_health():
    """API health check endpoint."""
    return {"status": "healthy", "api_version": "v1"}
