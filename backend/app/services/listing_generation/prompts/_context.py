"""Blocco testuale comune dai dati strategia confermata."""

from app.schemas.confirmed_product_strategy import ConfirmedProductStrategy
from app.schemas.listing_generation import InjectedRules


def format_strategy_for_prompt(strategy: ConfirmedProductStrategy) -> str:
    """Serializza la strategia in italiano per i prompt utente."""
    parts: list[str] = [
        f"Nome prodotto: {strategy.nome_prodotto}",
        f"Categoria: {strategy.categoria or 'non specificata'}",
        f"Livello prezzo (tono): {strategy.livello_prezzo}",
    ]
    if strategy.caratteristiche_tecniche:
        parts.append("Caratteristiche tecniche:\n- " + "\n- ".join(strategy.caratteristiche_tecniche))
    if strategy.benefici_principali:
        parts.append("Benefici principali:\n- " + "\n- ".join(strategy.benefici_principali))
    if strategy.usp_differenziazione:
        parts.append(f"USP / differenziazione: {strategy.usp_differenziazione}")
    if strategy.target_cliente:
        parts.append(f"Target cliente: {strategy.target_cliente}")
    if strategy.gestione_obiezioni:
        parts.append("Obiezioni da gestire:\n- " + "\n- ".join(strategy.gestione_obiezioni))
    if strategy.insight_recensioni_clienti:
        parts.append(f"Insight recensioni / clienti: {strategy.insight_recensioni_clienti}")
    if strategy.keyword_primarie:
        parts.append("Keyword primarie: " + ", ".join(strategy.keyword_primarie))
    if strategy.keyword_secondarie:
        parts.append("Keyword secondarie: " + ", ".join(strategy.keyword_secondarie))
    if strategy.keyword_planning is not None:
        kp = strategy.keyword_planning
        parts.append(f"Keyword primaria finale (planning): {kp.keyword_primaria_finale}")
        if kp.keyword_secondarie_prioritarie:
            parts.append("Keyword secondarie prioritarie (planning): " + ", ".join(kp.keyword_secondarie_prioritarie))
        if kp.parole_da_spingere_nel_frontend:
            parts.append("Parole da spingere nel frontend: " + ", ".join(kp.parole_da_spingere_nel_frontend))
        if kp.parole_da_tenere_per_backend:
            parts.append("Parole da tenere per backend: " + ", ".join(kp.parole_da_tenere_per_backend))
        if kp.note_su_keyword_da_non_forzare:
            parts.append("Note keyword da non forzare:\n- " + "\n- ".join(kp.note_su_keyword_da_non_forzare))
    if strategy.angolo_emotivo:
        parts.append(f"Angolo emotivo: {strategy.angolo_emotivo}")
    return "\n\n".join(parts)


def format_rules_addon(rules: InjectedRules | None, *, brand_fallback: str | None) -> str:
    chunks: list[str] = []
    bg = None
    if rules and rules.brand_guidelines:
        bg = rules.brand_guidelines
    elif brand_fallback:
        bg = brand_fallback
    if bg:
        chunks.append(f"Linee guida brand (obbligatorie):\n{bg}")
    if rules and rules.amazon_constraints:
        chunks.append(f"Vincoli marketplace / Amazon:\n{rules.amazon_constraints}")
    if rules and rules.banned_phrases:
        chunks.append("Frasi o termini da evitare:\n- " + "\n- ".join(rules.banned_phrases))
    if not chunks:
        return ""
    return "\n\n" + "\n\n".join(chunks)


def tone_hint_for_price_tier(tier: str) -> str:
    if tier == "entry":
        return "Tono diretto, chiaro, enfatizza valore e affidabilità accessibile. Evita lussi non credibili."
    if tier == "mid":
        return "Tono equilibrato tra qualità e concretezza; evidenza pratica e qualità percepita."
    if tier == "premium":
        return "Tono raffinato ma concreto; niente iperboli vuote, privilegia materiali, cura, durata, servizio."
    return "Tono professionale e neutro, adatta al contesto senza supposizioni sul lusso."
