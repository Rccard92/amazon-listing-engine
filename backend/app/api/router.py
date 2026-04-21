"""Router API v1."""

from fastapi import APIRouter

from app.api.routes import amazon_analysis, health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(amazon_analysis.router, tags=["amazon-analysis"])
