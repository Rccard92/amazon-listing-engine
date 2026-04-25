"""Layer 1: AI Context Builder per keyword intelligence."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import datetime, timezone
import time

from app.schemas.keyword_intelligence import (
    KeywordIntelligenceRequest,
    ProductAttributeSignal,
    ProductKeywordContext,
)
from app.schemas.product_brief import ProductBrief
from app.schemas.strategic_enrichment import StrategicEnrichment
from app.core.config import get_settings
from app.services.listing_generation.openai_llm_client import OpenAIListingLLMClient

_SYSTEM_PROMPT = """Sei un motore di Product+Keyword Context per Amazon Italia.
Ricevi dati prodotto strutturati e devi produrre SOLO JSON valido.
Obiettivo: costruire contesto dinamico per screening keyword (non generare copy).
Non inventare feature/certificazioni non presenti nei dati.
Restituisci esattamente questo schema:
{
  "product_type": "string",
  "marketplace_category": "string",
  "brand": "string",
  "confirmed_attributes": [{"name":"string","value":"string","confidence":0.0,"source":"string"}],
  "uncertain_attributes": [{"name":"string","value":"string","confidence":0.0,"source":"string"}],
  "excluded_attributes": [{"name":"string","value":"string","confidence":0.0,"source":"string"}],
  "allowed_keyword_concepts": ["string"],
  "forbidden_keyword_concepts": ["string"],
  "possible_competitor_brands": ["string"],
  "clarification_questions": [{"id":"string","question":"string","reason":"string"}],
  "confidence_score": 0.0,
  "reasoning_summary": "string"
}
"""


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "").strip().lower())


def _dedupe(values: list[str]) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    for item in values:
        token = _norm(item)
        if not token or token in seen:
            continue
        seen.add(token)
        out.append(token)
    return out


def _extract_json(raw: str) -> dict:
    m = re.search(r"\{[\s\S]*\}", raw.strip())
    if not m:
        raise ValueError("Nessun JSON object valido")
    return json.loads(m.group(0))


def _active_model_name() -> str | None:
    settings = get_settings()
    model = (settings.openai_listing_model or settings.openai_model or "").strip()
    return model or None


@dataclass
class KeywordContextBuilderService:
    """Costruisce ProductKeywordContext con fallback deterministico."""

    llm: OpenAIListingLLMClient | None = None
    last_forensic_trace: dict | None = None

    def build(
        self,
        *,
        brief: ProductBrief,
        enrichment: StrategicEnrichment | None,
        request: KeywordIntelligenceRequest,
        enable_ai: bool,
    ) -> ProductKeywordContext:
        started = time.perf_counter()
        requested_at = datetime.now(timezone.utc).isoformat()
        if enable_ai:
            try:
                out = self._build_with_ai(brief=brief, enrichment=enrichment, request=request)
                self.last_forensic_trace = {
                    "executed": True,
                    "openai_called": True,
                    "mode": "ai",
                    "requested_at": requested_at,
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                    "duration_ms": int((time.perf_counter() - started) * 1000),
                    "model_name": _active_model_name(),
                    "success": True,
                    "fallback_used": False,
                    "output": out.model_dump(mode="json"),
                }
                return out
            except Exception as exc:
                out = self._build_fallback(brief=brief, enrichment=enrichment, request=request)
                self.last_forensic_trace = {
                    "executed": True,
                    "openai_called": True,
                    "mode": "fallback",
                    "requested_at": requested_at,
                    "completed_at": datetime.now(timezone.utc).isoformat(),
                    "duration_ms": int((time.perf_counter() - started) * 1000),
                    "model_name": _active_model_name(),
                    "success": False,
                    "fallback_used": True,
                    "fallback_reason": str(exc),
                    "output": out.model_dump(mode="json"),
                }
                return out
        out = self._build_fallback(brief=brief, enrichment=enrichment, request=request)
        self.last_forensic_trace = {
            "executed": False,
            "openai_called": False,
            "mode": "fallback",
            "requested_at": requested_at,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "duration_ms": int((time.perf_counter() - started) * 1000),
            "model_name": None,
            "success": True,
            "fallback_used": True,
            "fallback_reason": "ai_context_builder_disabled",
            "output": out.model_dump(mode="json"),
        }
        return out

    def _build_with_ai(
        self,
        *,
        brief: ProductBrief,
        enrichment: StrategicEnrichment | None,
        request: KeywordIntelligenceRequest,
    ) -> ProductKeywordContext:
        client = self.llm or OpenAIListingLLMClient()
        sample_rows = [row.model_dump(mode="json") for row in request.helium10_rows[:25]]
        payload = {
            "product_brief": brief.model_dump(mode="json"),
            "strategic_enrichment": enrichment.model_dump(mode="json") if enrichment else None,
            "manual_seed_keywords": request.manual_seed_keywords[:40],
            "helium10_sample": sample_rows,
        }
        raw = client.generate_text(
            system_prompt=_SYSTEM_PROMPT,
            user_prompt=json.dumps(payload, ensure_ascii=True),
            max_output_tokens=2200,
        )
        data = _extract_json(raw)
        return ProductKeywordContext(
            product_type=str(data.get("product_type") or brief.nome_prodotto),
            marketplace_category=str(data.get("marketplace_category") or brief.categoria or ""),
            brand=str(data.get("brand") or brief.brand or ""),
            confirmed_attributes=[
                ProductAttributeSignal.model_validate(item)
                for item in (data.get("confirmed_attributes") or [])
                if isinstance(item, dict)
            ][:20],
            uncertain_attributes=[
                ProductAttributeSignal.model_validate(item)
                for item in (data.get("uncertain_attributes") or [])
                if isinstance(item, dict)
            ][:20],
            excluded_attributes=[
                ProductAttributeSignal.model_validate(item)
                for item in (data.get("excluded_attributes") or [])
                if isinstance(item, dict)
            ][:20],
            allowed_keyword_concepts=_dedupe([str(x) for x in (data.get("allowed_keyword_concepts") or [])])[:80],
            forbidden_keyword_concepts=_dedupe([str(x) for x in (data.get("forbidden_keyword_concepts") or [])])[:80],
            possible_competitor_brands=_dedupe([str(x) for x in (data.get("possible_competitor_brands") or [])])[:40],
            clarification_questions=[
                {
                    "id": str(item.get("id") or f"q_{idx+1}"),
                    "question": str(item.get("question") or ""),
                    "reason": str(item.get("reason") or ""),
                }
                for idx, item in enumerate(data.get("clarification_questions") or [])
                if isinstance(item, dict)
            ][:8],
            confidence_score=max(0.0, min(1.0, float(data.get("confidence_score") or 0.0))),
            reasoning_summary=str(data.get("reasoning_summary") or ""),
        )

    def _build_fallback(
        self,
        *,
        brief: ProductBrief,
        enrichment: StrategicEnrichment | None,
        request: KeywordIntelligenceRequest,
    ) -> ProductKeywordContext:
        confirmed = [
            ProductAttributeSignal(name="caratteristica", value=item, confidence=0.78, source="brief")
            for item in brief.caratteristiche_specifiche[:10]
        ]
        if enrichment:
            confirmed.extend(
                ProductAttributeSignal(name="beneficio", value=item, confidence=0.72, source="enrichment")
                for item in enrichment.benefici_principali[:8]
            )
        uncertain: list[ProductAttributeSignal] = []
        if not brief.dettagli_articolo:
            uncertain.append(
                ProductAttributeSignal(
                    name="dettagli_articolo",
                    value="Dettagli articolo non presenti",
                    confidence=0.45,
                    source="brief",
                )
            )
        if not brief.categoria:
            uncertain.append(
                ProductAttributeSignal(
                    name="categoria",
                    value="Categoria non confermata",
                    confidence=0.4,
                    source="brief",
                )
            )
        allowed = _dedupe(
            [
                brief.nome_prodotto,
                brief.categoria or "",
                *brief.keyword_primarie,
                *brief.keyword_secondarie,
                *request.manual_seed_keywords,
            ]
        )
        forbidden = _dedupe(
            [
                "ricambio",
                "gratis",
                "download",
                "usato",
                "universale",
            ]
        )
        return ProductKeywordContext(
            product_type=brief.nome_prodotto.strip(),
            marketplace_category=(brief.categoria or "").strip(),
            brand=(brief.brand or "").strip(),
            confirmed_attributes=confirmed[:20],
            uncertain_attributes=uncertain[:20],
            excluded_attributes=[],
            allowed_keyword_concepts=allowed[:60],
            forbidden_keyword_concepts=forbidden[:40],
            possible_competitor_brands=[],
            clarification_questions=[
                {
                    "id": "category_confirm",
                    "question": "Puoi confermare la categoria Amazon esatta del prodotto?",
                    "reason": "Migliora il filtro off-target.",
                }
            ]
            if not brief.categoria
            else [],
            confidence_score=0.72 if brief.categoria else 0.58,
            reasoning_summary="Contesto generato con fallback deterministico dai dati disponibili.",
        )
