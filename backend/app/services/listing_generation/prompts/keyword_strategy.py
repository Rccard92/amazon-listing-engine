"""Prompt builder: search terms backend Amazon Italia."""

from app.schemas.confirmed_product_strategy import ConfirmedProductStrategy
from app.schemas.listing_generation import InjectedRules
from app.schemas.keyword_planning import GeneratedFrontendContent

from app.services.listing_generation.keyword_coverage import remaining_backend_opportunities
from app.services.listing_generation.prompts._context import format_rules_addon, format_strategy_for_prompt


def build_keyword_strategy_system_prompt(*, dogma_addon: str = "") -> str:
    return (
        "Sei un esperto SEO Amazon per il mercato italiano. "
        "Generi una singola riga di search terms da incollare nel campo backend (stile Amazon): "
        "solo parole/chiavi separate da spazio, minuscole dove ha senso, niente virgole, niente frasi promozionali, "
        "niente riferimenti a fasce d'età o genere, niente 'migliore in assoluto' o claim generici. "
        "Massimizza copertura semantica con termini combinali e intento di ricerca. "
        "Output: una sola riga, senza JSON, senza spiegazioni."
        f"{dogma_addon}"
    )


def build_keyword_strategy_user_prompt(
    strategy: ConfirmedProductStrategy,
    rules: InjectedRules | None,
    *,
    max_bytes: int,
    generated_frontend_content: GeneratedFrontendContent | None = None,
) -> str:
    base = format_strategy_for_prompt(strategy)
    addon = format_rules_addon(rules, brand_fallback=strategy.linee_guida_brand)
    frontend_block = ""
    if generated_frontend_content is not None:
        frontend_block = (
            "\n\nContenuti frontend gia presenti (da non duplicare in modo sterile):\n"
            f"- Titolo: {generated_frontend_content.seo_title or ''}\n"
            f"- Bullet: {' | '.join(generated_frontend_content.bullets or [])}\n"
            f"- Descrizione: {generated_frontend_content.description or ''}\n"
        )
    remaining = remaining_backend_opportunities(
        plan=strategy.confirmed_keyword_plan,
        frontend_content=generated_frontend_content,
    )
    remaining_block = ""
    if remaining:
        remaining_block = "\nOpportunita semantiche residue da privilegiare: " + ", ".join(remaining) + "\n"
    return (
        f"{base}\n\n"
        f"Limite approssimativo: resta entro ~{max_bytes} byte UTF-8 (stringa più corta se necessario).\n"
        f"{addon}\n"
        f"{frontend_block}\n"
        f"{remaining_block}\n"
        "Non ripetere keyword identiche consecutive; rimuovi ridondanze. "
        "Priorita: copri spazio semantico non ancora saturo nei contenuti frontend. "
        "Rispondi con una sola riga di termini separati da spazio."
    )
