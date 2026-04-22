"""Prompt builder: descrizione scheda Amazon."""

from app.schemas.confirmed_product_strategy import ConfirmedProductStrategy
from app.schemas.listing_generation import InjectedRules

from app.services.listing_generation.prompts._context import (
    format_rules_addon,
    format_strategy_for_prompt,
    tone_hint_for_price_tier,
)


def build_description_system_prompt() -> str:
    return (
        "Sei un copywriter Amazon per l'Italia. Scrivi la descrizione prodotto (testo lungo) per conversione e credibilità. "
        "Struttura: 3-5 paragrafi brevi separati da una riga vuota; tono professionale e concreto. "
        "Integra USP, target, obiezioni e benefici; usa insight recensioni con cautela. "
        "Niente keyword stuffing; niente elenchi numerati tipo bullet; niente HTML. "
        "Output: solo il corpo della descrizione in italiano."
    )


def build_description_user_prompt(
    strategy: ConfirmedProductStrategy,
    rules: InjectedRules | None,
    *,
    min_chars: int,
    max_chars: int,
) -> str:
    tone = tone_hint_for_price_tier(strategy.livello_prezzo)
    base = format_strategy_for_prompt(strategy)
    addon = format_rules_addon(rules, brand_fallback=strategy.linee_guida_brand)
    return (
        f"{base}\n\n"
        f"Tono: {tone}\n"
        f"Target lunghezza: tra {min_chars} e {max_chars} caratteri (circa).\n"
        f"{addon}\n\n"
        "Scrivi la descrizione finale."
    )
