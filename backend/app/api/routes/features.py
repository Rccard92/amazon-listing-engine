"""Feature capabilities runtime (debug/dev controls)."""

from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.features import FeaturesResponse

router = APIRouter()


@router.get("/features", response_model=FeaturesResponse)
def get_features() -> FeaturesResponse:
    settings = get_settings()
    return FeaturesResponse(ai_debug_trace_enabled=settings.enable_ai_debug_trace)
