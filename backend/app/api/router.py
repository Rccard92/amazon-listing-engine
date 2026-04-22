"""Router API v1."""

from fastapi import APIRouter

from app.api.routes import amazon_analysis, health, projects, work_items, workflows

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(amazon_analysis.router, tags=["amazon-analysis"])
api_router.include_router(workflows.router, tags=["workflows"])
api_router.include_router(projects.router, tags=["projects"])
api_router.include_router(work_items.router, tags=["work-items"])
