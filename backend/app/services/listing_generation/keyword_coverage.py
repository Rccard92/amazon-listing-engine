"""Utility coverage keyword tra piano e contenuti frontend."""

from __future__ import annotations

import re

from app.schemas.keyword_intelligence import ConfirmedKeywordPlan
from app.schemas.keyword_planning import GeneratedFrontendContent
from app.services.keyword_intelligence.plan_canonical import normalize_confirmed_keyword_plan


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def remaining_backend_opportunities(
    *,
    plan: ConfirmedKeywordPlan | None,
    frontend_content: GeneratedFrontendContent | None,
) -> list[str]:
    if plan is None:
        return []
    plan = normalize_confirmed_keyword_plan(plan)
    excluded = {
        _normalize(item.keyword)
        for item in plan.keyword_escluse_definitivamente
    }
    excluded.update(_normalize(k) for k in plan.excluded_keywords if str(k).strip())
    verify = {
        _normalize(item.keyword)
        for item in plan.classificazioni_confermate
        if item.category == "VERIFY_PRODUCT_FEATURE" or item.required_user_confirmation
    }
    if plan.included_keywords:
        candidates = list(plan.included_keywords)
    else:
        candidates = [
            *plan.parole_da_tenere_per_backend,
            *plan.keyword_secondarie_prioritarie,
        ]
    uniq: list[str] = []
    seen: set[str] = set()
    for item in candidates:
        norm = _normalize(item)
        if not norm or norm in seen or norm in excluded or norm in verify:
            continue
        seen.add(norm)
        uniq.append(norm)

    if frontend_content is None:
        return uniq[:24]
    frontend_blob = _normalize(
        " ".join(
            [
                frontend_content.seo_title or "",
                " ".join(frontend_content.bullets or []),
                frontend_content.description or "",
            ]
        )
    )
    return [kw for kw in uniq if kw not in frontend_blob][:24]
