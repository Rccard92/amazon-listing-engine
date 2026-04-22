"""API Prompt Orchestrator — generazione copy per sezione."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.analysis_exceptions import AnalysisPipelineError
from app.schemas.confirmed_product_strategy import ConfirmedProductStrategy
from app.schemas.listing_generation import GenerateListingSectionRequest, ListingSectionResult
from app.services.listing_generation.orchestrator import ListingGenerationOrchestratorService
from app.services.listing_generation.strategy_from_draft import confirmed_strategy_from_work_item_input
from app.services.work_item_service import WorkItemService

router = APIRouter()
orchestrator = ListingGenerationOrchestratorService()
work_item_service = WorkItemService()


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
    "/listing-generation/generate",
    response_model=ListingSectionResult,
    status_code=status.HTTP_200_OK,
)
def generate_listing_section(payload: GenerateListingSectionRequest) -> ListingSectionResult:
    """Genera una sola sezione (titolo, bullet, descrizione o keyword backend)."""
    try:
        return orchestrator.generate(payload)
    except AnalysisPipelineError as exc:
        raise _http_from_pipeline(exc) from exc


@router.get(
    "/listing-generation/confirmed-strategy/{item_id}",
    response_model=ConfirmedProductStrategy,
    status_code=status.HTTP_200_OK,
)
def get_confirmed_strategy_from_work_item(item_id: UUID, db: Session = Depends(get_db)) -> ConfirmedProductStrategy:
    """Deriva la strategia confermata dal work item (workflow competitor / analisi)."""
    item = work_item_service.get_item(db, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elemento non trovato.")
    raw = item.input_data or {}
    return confirmed_strategy_from_work_item_input(dict(raw))
