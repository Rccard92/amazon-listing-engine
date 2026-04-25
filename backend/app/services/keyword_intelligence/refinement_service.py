"""Layer 3: refinement AI post-veto con fallback sicuro."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass

from app.schemas.keyword_intelligence import KeywordClassificationItem, ProductKeywordContext
from app.services.listing_generation.openai_llm_client import OpenAIListingLLMClient

_SYSTEM_PROMPT = """Sei un motore di refinement keyword Amazon Italia.
Ricevi solo keyword gia passate dal veto.
Non riabilitare keyword escluse/verify.
Per ogni keyword, restituisci:
- category suggerita (PRIMARY_SEO|SECONDARY_SEO|FEATURE_KEYWORD|LONG_TAIL|BACKEND_ONLY)
- recommended_usage (title|bullets_description|backend_search_terms)
- priority (high|medium|low)
- rationale breve in italiano.
Output SOLO JSON:
{"items":[{"keyword":"...","category":"...","recommended_usage":"...","priority":"...","rationale":"..."}]}
"""


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "").strip().lower())


def _extract_json(raw: str) -> dict:
    m = re.search(r"\{[\s\S]*\}", raw.strip())
    if not m:
        raise ValueError("Nessun JSON object")
    return json.loads(m.group(0))


@dataclass
class KeywordRefinementService:
    """Rifinisce classificazioni allowed con AI; fallback deterministico."""

    llm: OpenAIListingLLMClient | None = None

    def refine(
        self,
        *,
        items: list[KeywordClassificationItem],
        context: ProductKeywordContext,
        enable_ai: bool,
    ) -> tuple[list[KeywordClassificationItem], dict[str, int]]:
        allowed_items = [
            item
            for item in items
            if item.recommended_usage not in ("exclude", "verify")
            and item.category not in ("OFF_TARGET", "NEGATIVE_KEYWORD", "BRANDED_COMPETITOR", "VERIFY_PRODUCT_FEATURE")
        ]
        if not enable_ai or not allowed_items:
            return items, {"refined": 0, "fallback": len(allowed_items)}
        try:
            refined_map = self._refine_with_ai(allowed_items=allowed_items, context=context)
        except Exception:
            return items, {"refined": 0, "fallback": len(allowed_items)}

        for item in items:
            refined = refined_map.get(_norm(item.keyword))
            if not refined:
                continue
            item.category = refined.get("category", item.category)
            item.recommended_usage = refined.get("recommended_usage", item.recommended_usage)
            item.priority = refined.get("priority", item.priority)
            item.rationale = refined.get("rationale", item.rationale)
        return items, {"refined": len(refined_map), "fallback": max(0, len(allowed_items) - len(refined_map))}

    def _refine_with_ai(
        self,
        *,
        allowed_items: list[KeywordClassificationItem],
        context: ProductKeywordContext,
    ) -> dict[str, dict[str, str]]:
        client = self.llm or OpenAIListingLLMClient()
        payload = {
            "context": {
                "product_type": context.product_type,
                "marketplace_category": context.marketplace_category,
                "allowed_keyword_concepts": context.allowed_keyword_concepts[:40],
            },
            "items": [item.model_dump(mode="json") for item in allowed_items[:120]],
        }
        raw = client.generate_text(
            system_prompt=_SYSTEM_PROMPT,
            user_prompt=json.dumps(payload, ensure_ascii=True),
            max_output_tokens=2000,
        )
        data = _extract_json(raw)
        out: dict[str, dict[str, str]] = {}
        for item in data.get("items") or []:
            if not isinstance(item, dict):
                continue
            keyword = _norm(str(item.get("keyword") or ""))
            if not keyword:
                continue
            out[keyword] = {
                "category": str(item.get("category") or ""),
                "recommended_usage": str(item.get("recommended_usage") or ""),
                "priority": str(item.get("priority") or ""),
                "rationale": str(item.get("rationale") or ""),
            }
        return out
