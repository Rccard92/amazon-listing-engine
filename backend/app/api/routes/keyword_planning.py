"""API keyword planning (fase intermedia pre-generazione copy)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.keyword_planning import KeywordPlanning
from app.services.keyword_planning import KeywordPlanningService
from app.services.listing_generation.strategy_from_draft import confirmed_strategy_from_work_item_input
from app.services.work_item_service import WorkItemService

router = APIRouter()
_service = KeywordPlanningService()
_work_items = WorkItemService()


@router.post(
    "/keyword-planning/plan-work-item/{item_id}",
    response_model=KeywordPlanning,
    status_code=status.HTTP_200_OK,
)
def plan_keywords_for_work_item(item_id: UUID, db: Session = Depends(get_db)) -> KeywordPlanning:
    item = _work_items.get_item(db, item_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elemento non trovato.")
    raw = dict(item.input_data or {})
    strategy = confirmed_strategy_from_work_item_input(raw)
    if not strategy.nome_prodotto.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Work item senza nome prodotto: completa Fase 1 prima del keyword planning.",
        )
    return _service.build_plan(strategy)
