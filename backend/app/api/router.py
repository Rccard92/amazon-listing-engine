"""Router API v1 — route di ingestion URL registrate solo se abilitate (MVP manuale-first)."""

from fastapi import APIRouter

from app.api.routes import health, listing_generation, projects, work_items
from app.core.config import get_settings


def build_api_router() -> APIRouter:
    """Costruisce il router in base a `enable_url_ingestion` (valutato alla creazione app)."""
    api_router = APIRouter()
    api_router.include_router(health.router, tags=["health"])

    if get_settings().enable_url_ingestion:
        from app.api.routes import amazon_analysis, workflows

        api_router.include_router(amazon_analysis.router, tags=["amazon-analysis"])
        api_router.include_router(workflows.router, tags=["workflows"])

    api_router.include_router(listing_generation.router, tags=["listing-generation"])
    api_router.include_router(projects.router, tags=["projects"])
    api_router.include_router(work_items.router, tags=["work-items"])
    return api_router
