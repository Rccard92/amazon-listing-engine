"""Prompt builder: search terms backend Amazon Italia."""

from app.schemas.confirmed_product_strategy import ConfirmedProductStrategy
from app.schemas.listing_generation import InjectedRules

from app.services.listing_generation.prompts._context import format_rules_addon, format_strategy_for_prompt


def build_keyword_strategy_system_prompt() -> str:
    return (
        "Sei un esperto SEO Amazon per il mercato italiano. "
        "Generi una singola riga di search terms da incollare nel campo backend (stile Amazon): "
        "solo parole/chiavi separate da spazio, minuscole dove ha senso, niente virgole, niente frasi promozionali, "
        "niente riferimenti a fasce d'età o genere, niente 'migliore in assoluto' o claim generici. "
        "Massimizza copertura semantica con termini combinali e intento di ricerca. "
        "Output: una sola riga, senza JSON, senza spiegazioni."
    )


def build_keyword_strategy_user_prompt(
    strategy: ConfirmedProductStrategy,
    rules: InjectedRules | None,
    *,
    max_bytes: int,
) -> str:
    base = format_strategy_for_prompt(strategy)
    addon = format_rules_addon(rules, brand_fallback=strategy.linee_guida_brand)
    return (
        f"{base}\n\n"
        f"Limite approssimativo: resta entro ~{max_bytes} byte UTF-8 (stringa più corta se necessario).\n"
        f"{addon}\n\n"
        "Non ripetere keyword identiche consecutive; rimuovi ridondanze. "
        "Rispondi con una sola riga di termini separati da spazio."
    )
