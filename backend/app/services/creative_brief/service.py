"""Generazione Brief Creativo via LLM."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from app.core.config import get_settings
from app.core.dogma import CreativeBriefDogmaKind, build_creative_brief_dogma_addon
from app.schemas.analysis_exceptions import AnalysisPipelineError
from app.schemas.creative_brief import CreativeBriefArea, CreativeBriefGenerateResponse
from app.services.creative_brief.context import build_creative_brief_user_prompt
from app.services.creative_brief.prompts import system_preamble_for_area
from app.services.listing_generation.openai_llm_client import OpenAIListingLLMClient
from app.services.listing_generation.strategy_from_draft import confirmed_strategy_from_work_item_input
from app.services.work_item_service import WorkItemService


class CreativeBriefService:
    """Orchestra contesto work item e chiamata LLM per area brief creativo."""

    def __init__(self) -> None:
        self._llm = OpenAIListingLLMClient()
        self._work_items = WorkItemService()

    def generate(
        self,
        *,
        db: Any,
        work_item_id: UUID,
        area: CreativeBriefArea,
        include_raw_model_text: bool = False,
    ) -> CreativeBriefGenerateResponse:
        item = self._work_items.get_item(db, work_item_id)
        if item is None:
            raise AnalysisPipelineError(
                "WORK_ITEM_NOT_FOUND",
                http_status=404,
                message_it="Work item non trovato.",
            )
        input_data = dict(item.input_data or {})
        generated_output = dict(item.generated_output or {})
        strategy = confirmed_strategy_from_work_item_input(input_data)
        if not (strategy.nome_prodotto or "").strip():
            raise AnalysisPipelineError(
                "STRATEGY_INCOMPLETE",
                http_status=422,
                message_it="Nome prodotto mancante: completa il brief prima del Brief Creativo.",
            )

        kind: CreativeBriefDogmaKind = area  # type: ignore[assignment]
        dogma_addon = build_creative_brief_dogma_addon(kind)
        system_prompt = system_preamble_for_area(area) + "\n" + dogma_addon
        user_prompt = build_creative_brief_user_prompt(
            input_data=input_data,
            generated_output=generated_output,
        )

        max_tokens = 4096 if area == "gallery" else 3500
        raw = self._llm.generate_text(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_output_tokens=max_tokens,
        )
        body = (raw or "").strip()
        if not body:
            raise AnalysisPipelineError(
                "CREATIVE_BRIEF_EMPTY",
                http_status=502,
                message_it="Il modello non ha restituito testo per il brief creativo.",
            )

        now = datetime.now(timezone.utc).isoformat()
        return CreativeBriefGenerateResponse(
            area=area,
            body=body,
            updated_at=now,
            raw_model_text=raw if include_raw_model_text and get_settings().enable_ai_debug_trace else None,
        )
