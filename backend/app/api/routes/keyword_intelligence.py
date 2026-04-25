"""API Keyword Intelligence (nuova Fase 3 prima della generazione)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.schemas.keyword_intelligence import KeywordIntelligenceRequest, KeywordIntelligenceResponse
from app.schemas.product_brief import ProductBrief
from app.schemas.strategic_enrichment import StrategicEnrichment
from app.services.keyword_intelligence import KeywordIntelligenceService
from app.services.listing_generation.strategy_from_draft import PRODUCT_BRIEF_KEY, STRATEGIC_ENRICHMENT_KEY
from app.services.work_item_service import WorkItemService

router = APIRouter()
_service = KeywordIntelligenceService()
_work_items = WorkItemService()


@router.post(
    "/keyword-intelligence/plan-work-item/{item_id}",
    response_model=KeywordIntelligenceResponse,
    status_code=status.HTTP_200_OK,
)
def build_keyword_intelligence_for_work_item(
    item_id: UUID,
    payload: KeywordIntelligenceRequest,
    db: Session = Depends(get_db),
) -> KeywordIntelligenceResponse:
    item = _work_items.get_item(db, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elemento non trovato.")
    raw = dict(item.input_data or {})
    pb_raw = raw.get(PRODUCT_BRIEF_KEY)
    if not isinstance(pb_raw, dict):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Work item senza product_brief: completa Fase 1 prima della Keyword Intelligence.",
        )
    brief = ProductBrief.model_validate(pb_raw)
    enr_raw = raw.get(STRATEGIC_ENRICHMENT_KEY)
    enrichment = StrategicEnrichment.model_validate(enr_raw) if isinstance(enr_raw, dict) else None
    trace_enabled = bool(get_settings().enable_ai_debug_trace and payload.include_debug_trace)
    return _service.run_with_trace(
        brief=brief,
        enrichment=enrichment,
        request=payload,
        include_debug_trace=trace_enabled,
    )
