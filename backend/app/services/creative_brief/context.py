"""Assembla il contesto testuale per Brief Creativo da work item."""

from __future__ import annotations

from typing import Any

from app.services.keyword_intelligence.plan_canonical import normalize_confirmed_keyword_plan
from app.services.listing_generation.prompts._context import format_strategy_for_prompt
from app.services.listing_generation.strategy_from_draft import confirmed_strategy_from_work_item_input


def _listing_sections_blob(generated_output: dict[str, Any]) -> str:
    lg = generated_output.get("listing_generation")
    if not isinstance(lg, dict):
        return "(Nessun output generazione listing salvato.)"
    sections = lg.get("sections")
    if not isinstance(sections, dict):
        return "(Sezioni listing non presenti.)"
    chunks: list[str] = []

    st = sections.get("seo_title")
    if isinstance(st, dict) and st.get("seo_title"):
        chunks.append(f"Titolo SEO: {st.get('seo_title')}")

    bp = sections.get("bullet_points")
    if isinstance(bp, dict) and bp.get("bullets"):
        bullets = bp.get("bullets")
        if isinstance(bullets, list):
            chunks.append("Bullet:\n" + "\n".join(f"- {b}" for b in bullets if str(b).strip()))

    desc = sections.get("description")
    if isinstance(desc, dict) and desc.get("description"):
        chunks.append(f"Descrizione:\n{desc.get('description')}")

    kw = sections.get("keyword_strategy")
    if isinstance(kw, dict) and kw.get("backend_search_terms"):
        chunks.append(f"Search terms backend:\n{kw.get('backend_search_terms')}")

    if not chunks:
        return "(Sezioni listing vuote o non ancora generate.)"
    return "\n\n".join(chunks)


def build_creative_brief_user_prompt(*, input_data: dict[str, Any], generated_output: dict[str, Any]) -> str:
    """Contesto unico: strategia assemblata + copy Fase 4 + esclusioni keyword."""
    strategy = confirmed_strategy_from_work_item_input(dict(input_data))
    parts: list[str] = [
        "=== CONTESTO PRODOTTO E STRATEGIA (Fase 1-3) ===",
        format_strategy_for_prompt(strategy),
        "",
        "=== COPY LISTING GIA GENERATO (Fase 4) ===",
        _listing_sections_blob(generated_output),
    ]
    ckp = strategy.confirmed_keyword_plan
    if ckp is not None:
        normalized = normalize_confirmed_keyword_plan(ckp)
        excluded = [k for k in normalized.excluded_keywords if str(k).strip()]
        if excluded:
            parts.extend(
                [
                    "",
                    "=== KEYWORD ESCLUSE (vietate in ogni testo suggerito nel brief creativo) ===",
                    ", ".join(excluded),
                ]
            )
    parts.append(
        "\nGenera il brief richiesto usando solo le informazioni sopra. "
        "Non inventare certificazioni, garanzie o dati non presenti. "
        "Non usare le keyword escluse in messaggi o testi suggeriti."
    )
    return "\n".join(parts)
