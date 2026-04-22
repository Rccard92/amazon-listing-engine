"""Assembla ConfirmedProductStrategy da ProductBrief + StrategicEnrichment."""

from __future__ import annotations

import re

from app.schemas.confirmed_product_strategy import ConfirmedProductStrategy
from app.schemas.product_brief import ProductBrief
from app.schemas.strategic_enrichment import StrategicEnrichment


def _split_to_lines(text: str | None) -> list[str]:
    if not text or not str(text).strip():
        return []
    return [ln.strip() for ln in re.split(r"[\r\n]+", str(text)) if ln.strip()]


def assemble_confirmed_strategy(
    brief: ProductBrief,
    enrichment: StrategicEnrichment | None = None,
) -> ConfirmedProductStrategy:
    """Unisce brief manuale e campi arricchiti per alimentare l'orchestrator di generazione."""
    enr = enrichment or StrategicEnrichment()

    tech: list[str] = [x for x in brief.caratteristiche_specifiche if str(x).strip()]
    for chunk in (_split_to_lines(brief.dettagli_articolo) + _split_to_lines(brief.dettagli_aggiuntivi)):
        if chunk not in tech:
            tech.append(chunk)

    linee_parts: list[str] = []
    brand = (brief.brand or "").strip()
    if brand:
        linee_parts.append(f"Brand: {brand}")
    if brief.linee_guida_brand and brief.linee_guida_brand.strip():
        linee_parts.append(brief.linee_guida_brand.strip())
    if brief.note_utente and brief.note_utente.strip():
        linee_parts.append(f"Note operatore / vincoli: {brief.note_utente.strip()}")
    if brief.descrizione_attuale and brief.descrizione_attuale.strip():
        desc = brief.descrizione_attuale.strip()
        cap = desc[:2500] + ("…" if len(desc) > 2500 else "")
        linee_parts.append(f"Descrizione o copy attuale (riferimento, non copiare alla lettera):\n{cap}")
    if brief.bullet_attuali:
        bullets_txt = "\n".join(f"- {b.strip()}" for b in brief.bullet_attuali if str(b).strip())
        if bullets_txt:
            linee_parts.append(f"Bullet attuali (riferimento):\n{bullets_txt}")
    linee = "\n\n".join(linee_parts) if linee_parts else None

    nome = (brief.nome_prodotto or "").strip() or "Da completare"

    return ConfirmedProductStrategy(
        nome_prodotto=nome,
        categoria=(brief.categoria or "").strip() or None,
        caratteristiche_tecniche=tech,
        benefici_principali=[x for x in enr.benefici_principali if str(x).strip()],
        usp_differenziazione=(enr.usp_differenziazione or "").strip() or None,
        target_cliente=(enr.target_cliente or "").strip() or None,
        gestione_obiezioni=[x for x in enr.gestione_obiezioni if str(x).strip()],
        insight_recensioni_clienti=(brief.riassunto_ai_recensioni or "").strip() or None,
        keyword_primarie=[x for x in brief.keyword_primarie if str(x).strip()],
        keyword_secondarie=[x for x in brief.keyword_secondarie if str(x).strip()],
        linee_guida_brand=linee,
        angolo_emotivo=(enr.angolo_emotivo or "").strip() or None,
        livello_prezzo=brief.livello_prezzo,
    )
