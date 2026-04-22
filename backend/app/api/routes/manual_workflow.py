"""API Fase 2 — arricchimento strategico da brief."""

from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.analysis_exceptions import AnalysisPipelineError
from app.schemas.manual_workflow import EnrichStrategicFromWorkItemBody, EnrichStrategicRequest
from app.schemas.product_brief import ProductBrief
from app.schemas.strategic_enrichment import StrategicEnrichment
from app.services.listing_generation.strategy_from_draft import PRODUCT_BRIEF_KEY
from app.services.strategic_enrichment.enrichment_service import StrategicEnrichmentService
from app.services.work_item_service import WorkItemService

router = APIRouter()
_enrichment = StrategicEnrichmentService()
_work_items = WorkItemService()


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
    "/manual-workflow/enrich",
    response_model=StrategicEnrichment,
    status_code=status.HTTP_200_OK,
)
def enrich_from_brief(payload: EnrichStrategicRequest) -> StrategicEnrichment:
    """Suggerisce StrategicEnrichment a partire da un ProductBrief (senza salvataggio)."""
    try:
        return _enrichment.enrich(payload.product_brief)
    except AnalysisPipelineError as exc:
        raise _http_from_pipeline(exc) from exc
    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error_code": "ENRICHMENT_PARSE_FAILED", "message_it": "Risposta arricchimento non valida.", "details": str(exc)},
        ) from exc


@router.post(
    "/manual-workflow/enrich-work-item/{item_id}",
    response_model=StrategicEnrichment,
    status_code=status.HTTP_200_OK,
)
def enrich_from_work_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    body: EnrichStrategicFromWorkItemBody = Body(default_factory=EnrichStrategicFromWorkItemBody),
) -> StrategicEnrichment:
    """Carica `product_brief` dal work item (o usa override nel body) e restituisce arricchimento suggerito."""
    item = _work_items.get_item(db, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elemento non trovato.")
    raw = item.input_data or {}
    if body.product_brief is not None:
        brief = body.product_brief
    else:
        pb_raw = raw.get(PRODUCT_BRIEF_KEY)
        if not isinstance(pb_raw, dict):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Work item senza product_brief: completa prima la Fase 1.",
            )
        brief = ProductBrief.model_validate(pb_raw)
    try:
        return _enrichment.enrich(brief)
    except AnalysisPipelineError as exc:
        raise _http_from_pipeline(exc) from exc
    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error_code": "ENRICHMENT_PARSE_FAILED", "message_it": "Risposta arricchimento non valida.", "details": str(exc)},
        ) from exc
