"""API Brief Creativo."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.schemas.analysis_exceptions import AnalysisPipelineError
from app.schemas.creative_brief import CreativeBriefGenerateRequest, CreativeBriefGenerateResponse
from app.services.creative_brief.service import CreativeBriefService

router = APIRouter()
_service = CreativeBriefService()


def _http_from_pipeline(exc: AnalysisPipelineError) -> HTTPException:
    return HTTPException(
        status_code=exc.http_status,
        detail={
            "error_code": exc.error_code,
            "message_it": exc.message_it,
            "details": exc.details,
        },
    )


@router.post(
    "/creative-brief/generate",
    response_model=CreativeBriefGenerateResponse,
    status_code=status.HTTP_200_OK,
)
def generate_creative_brief(
    payload: CreativeBriefGenerateRequest,
    db: Session = Depends(get_db),
) -> CreativeBriefGenerateResponse:
    """Genera un area del Brief Creativo (galleria, A+ o FAQ) dal work item."""
    settings = get_settings()
    include_raw = bool(settings.enable_ai_debug_trace and payload.include_raw_model_text)
    safe = payload.model_copy(update={"include_raw_model_text": include_raw})
    try:
        return _service.generate(
            db=db,
            work_item_id=safe.work_item_id,
            area=safe.area,
            include_raw_model_text=safe.include_raw_model_text,
        )
    except AnalysisPipelineError as exc:
        raise _http_from_pipeline(exc) from exc
