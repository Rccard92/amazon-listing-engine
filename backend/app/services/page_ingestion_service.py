"""Assemblaggio payload di ingestione pagina per analisi AI."""

from typing import Any

from app.core.config import get_settings
from app.schemas.amazon_analysis import AmazonAnalyzeResponse, AmazonProductNormalized
from app.schemas.page_ingestion import PageIngestionPayload
from app.services.amazon_fetcher import FetchedPage
from app.services.amazon_parser_structured import ParsedAmazonData


def _parsed_to_dict(data: ParsedAmazonData) -> dict[str, Any]:
    return {
        "title": data.title,
        "brand": data.brand,
        "bullets": data.bullets,
        "description": data.description,
        "aplus_text": data.aplus_text,
        "rating": data.rating,
        "reviews_count": data.reviews_count,
        "price": data.price,
        "main_image": data.main_image,
    }


def compute_extraction_status(
    product: AmazonProductNormalized,
    parser_used: str,
    existing_warnings: list[str],
) -> tuple[str, list[str]]:
    """Restituisce extraction_status e avvisi aggiuntivi (complete | partial | failed)."""
    warnings = list(existing_warnings)
    if parser_used == "none":
        return "failed", warnings

    filled = sum(
        1
        for x in (
            product.title,
            product.brand,
            product.bullets,
            product.description,
            product.aplus_text,
        )
        if x
    )
    numeric = sum(1 for x in (product.price, product.rating, product.reviews_count) if x is not None)

    if filled == 0 and numeric == 0:
        return "failed", warnings

    if filled <= 1 or (not product.title and not product.bullets):
        warnings.append(
            "Estrazione parziale: titolo o punti elenco potrebbero mancare. Verifica i dati prima di procedere.",
        )
        return "partial", warnings

    if not product.title or len(product.bullets) < 2:
        warnings.append("Alcuni elementi chiave (titolo o bullet) sono incompleti.")
        return "partial", warnings

    return "complete", warnings


def build_page_text_digest(
    product: AmazonProductNormalized,
    structured: ParsedAmazonData,
    dom: ParsedAmazonData,
    max_chars: int,
) -> str:
    """Ricostruisce un blocco testuale denso per il modello (senza HTML grezzo)."""
    lines: list[str] = []
    if product.title:
        lines.append(f"Titolo normalizzato: {product.title}")
    if product.brand:
        lines.append(f"Brand: {product.brand}")
    if product.bullets:
        lines.append("Bullet (normalizzati):")
        lines.extend(f"- {b}" for b in product.bullets[:12])
    if product.description:
        lines.append(f"Descrizione (normalizzata): {product.description[:4000]}")
    if product.aplus_text:
        lines.append(f"Testo A+ (estratto): {product.aplus_text[:3000]}")

    if structured.title and structured.title != product.title:
        lines.append(f"Titolo (structured): {structured.title}")
    if dom.title and dom.title != product.title and dom.title != structured.title:
        lines.append(f"Titolo (DOM): {dom.title}")
    if dom.bullets and dom.bullets != product.bullets:
        lines.append("Bullet (DOM fallback):")
        lines.extend(f"- {b}" for b in dom.bullets[:8])

    text = "\n".join(lines).strip()
    if len(text) > max_chars:
        return f"{text[: max_chars - 20].rstrip()}\n...[troncato]"
    return text


def build_page_ingestion_payload(
    *,
    analyzed: AmazonAnalyzeResponse,
    fetched: FetchedPage,
    structured: ParsedAmazonData,
    dom: ParsedAmazonData,
) -> PageIngestionPayload:
    settings = get_settings()
    digest_limit = min(32_000, max(4_000, settings.openai_max_input_chars // 2))
    extraction_status, warnings = compute_extraction_status(
        analyzed.product,
        analyzed.parser_used,
        analyzed.warnings,
    )
    digest = build_page_text_digest(analyzed.product, structured, dom, digest_limit)

    return PageIngestionPayload(
        normalized_url=analyzed.normalized_url,
        fetch_http_status=fetched.status_code,
        asin=analyzed.product.asin,
        marketplace=analyzed.product.marketplace,
        parser_used=analyzed.parser_used,
        extraction_status=extraction_status,
        warnings=warnings,
        normalized_product=analyzed.product,
        structured_partial=_parsed_to_dict(structured),
        dom_partial=_parsed_to_dict(dom),
        page_text_digest=digest,
    )
