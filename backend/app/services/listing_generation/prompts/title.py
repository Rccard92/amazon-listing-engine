"""Prompt builder: titolo SEO Amazon."""

from app.schemas.confirmed_product_strategy import ConfirmedProductStrategy
from app.schemas.listing_generation import InjectedRules

from app.services.listing_generation.prompts._context import (
    format_rules_addon,
    format_strategy_for_prompt,
    tone_hint_for_price_tier,
)


def build_title_system_prompt(*, dogma_addon: str = "") -> str:
    return (
        "Sei un copywriter Amazon senior per il mercato italiano. "
        "Generi UN SOLO titolo prodotto per massimizzare chiarezza, CTR e coerenza SEO. "
        "Regole: inserisci le keyword incluse nel brief in modo naturale (al massimo una o due aggiuntive se servono); "
        "niente keyword stuffing ripetuto; niente MAIUSCOLE grida o emoji; niente promesse illegali o fuori dai dati. "
        "Output: una sola riga di testo, senza virgolette, senza prefissi."
        f"{dogma_addon}"
    )


def build_title_user_prompt(
    strategy: ConfirmedProductStrategy,
    rules: InjectedRules | None,
    *,
    max_chars: int,
) -> str:
    tone = tone_hint_for_price_tier(strategy.livello_prezzo)
    base = format_strategy_for_prompt(strategy)
    addon = format_rules_addon(rules, brand_fallback=strategy.linee_guida_brand)
    return (
        f"{base}\n\n"
        f"Istruzione tono in base al livello prezzo: {tone}\n"
        f"Lunghezza massima consigliata: {max_chars} caratteri (resta sotto se possibile).\n"
        f"{addon}\n\n"
        "Rispondi solo con il titolo, una riga."
    )
