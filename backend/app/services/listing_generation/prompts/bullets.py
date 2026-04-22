"""Prompt builder: cinque bullet point Amazon."""

from app.schemas.confirmed_product_strategy import ConfirmedProductStrategy
from app.schemas.listing_generation import InjectedRules

from app.services.listing_generation.prompts._context import (
    format_rules_addon,
    format_strategy_for_prompt,
    tone_hint_for_price_tier,
)


def build_bullets_system_prompt() -> str:
    return (
        "Sei un copywriter Amazon per l'Italia. Devi produrre ESATTAMENTE 5 bullet point per scheda prodotto. "
        "Ogni bullet: una frase o due, focus su beneficio concreto collegato a feature; tono Amazon (non landing page, non teatrale). "
        "Usa insight recensioni solo se coerenti con i dati forniti. "
        "Niente emoji, niente 'scopri', 'wow', 'incredibile'. "
        "Output SOLO JSON valido, senza markdown, nel formato: "
        '{"bullets": ["...", "...", "...", "...", "..."]}'
    )


def build_bullets_user_prompt(strategy: ConfirmedProductStrategy, rules: InjectedRules | None) -> str:
    tone = tone_hint_for_price_tier(strategy.livello_prezzo)
    base = format_strategy_for_prompt(strategy)
    addon = format_rules_addon(rules, brand_fallback=strategy.linee_guida_brand)
    return (
        f"{base}\n\n"
        f"Tono: {tone}\n"
        f"{addon}\n\n"
        "Genera 5 bullet distinti (nessuna ripetizione sostanziale tra bullet). "
        'Output: solo oggetto JSON {"bullets": [5 stringhe]}.'
    )
