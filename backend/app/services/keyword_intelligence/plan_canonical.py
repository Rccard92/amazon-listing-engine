"""Normalizzazione piano keyword: elenchi canonici included/excluded + compatibilità legacy."""

from __future__ import annotations

import re

from app.schemas.keyword_intelligence import ConfirmedKeywordPlan


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "").strip().lower())


def normalize_confirmed_keyword_plan(plan: ConfirmedKeywordPlan) -> ConfirmedKeywordPlan:
    """
    Deriva `included_keywords` e `excluded_keywords` dalle liste legacy e dagli item strutturati.
    Idempotente se i campi legacy sono già coerenti.
    """
    excluded_items = list(plan.keyword_escluse_definitivamente)
    if plan.vetoed_keywords:
        excluded_items.extend(plan.vetoed_keywords)

    seen_ex: set[str] = set()
    excluded_keywords: list[str] = []
    for item in excluded_items:
        n = _norm(item.keyword)
        if not n or n in seen_ex:
            continue
        seen_ex.add(n)
        excluded_keywords.append(str(item.keyword).strip())

    for kw in plan.excluded_keywords or []:
        n = _norm(kw)
        if not n or n in seen_ex:
            continue
        seen_ex.add(n)
        excluded_keywords.append(str(kw).strip())

    pool: list[str] = []
    seen_in: set[str] = set()
    for lst in (plan.parole_da_spingere_nel_frontend, plan.parole_da_tenere_per_backend):
        for kw in lst or []:
            raw = str(kw).strip()
            n = _norm(raw)
            if not n or n in seen_ex or n in seen_in:
                continue
            seen_in.add(n)
            pool.append(raw)

    if not pool:
        if plan.keyword_primaria_finale.strip():
            raw = plan.keyword_primaria_finale.strip()
            n = _norm(raw)
            if n not in seen_ex and n not in seen_in:
                seen_in.add(n)
                pool.append(raw)
        for kw in plan.keyword_secondarie_prioritarie or []:
            raw = str(kw).strip()
            n = _norm(raw)
            if not n or n in seen_ex or n in seen_in:
                continue
            seen_in.add(n)
            pool.append(raw)

    return plan.model_copy(
        update={
            "included_keywords": pool,
            "excluded_keywords": excluded_keywords,
        }
    )
