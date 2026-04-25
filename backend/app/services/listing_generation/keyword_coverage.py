"""Utility coverage keyword tra piano e contenuti frontend."""

from __future__ import annotations

import re

from app.schemas.keyword_intelligence import ConfirmedKeywordPlan
from app.schemas.keyword_planning import GeneratedFrontendContent


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip().lower())


def remaining_backend_opportunities(
    *,
    plan: ConfirmedKeywordPlan | None,
    frontend_content: GeneratedFrontendContent | None,
) -> list[str]:
    if plan is None:
        return []
    candidates = [
        *plan.parole_da_tenere_per_backend,
        *plan.keyword_secondarie_prioritarie,
    ]
    uniq: list[str] = []
    seen: set[str] = set()
    for item in candidates:
        norm = _normalize(item)
        if not norm or norm in seen:
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
