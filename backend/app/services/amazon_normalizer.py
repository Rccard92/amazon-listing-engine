"""Normalizzazione output parser Amazon in contratto interno."""

from app.schemas.amazon_analysis import AmazonProductNormalized
from app.services.amazon_parser_structured import ParsedAmazonData


def normalize_product_output(
    *,
    asin: str,
    marketplace: str,
    structured: ParsedAmazonData,
    dom: ParsedAmazonData,
) -> tuple[AmazonProductNormalized, str]:
    """Merge deterministico structured -> dom + pulizia minima."""
    bullets = _merge_bullets(structured.bullets, dom.bullets)
    data = AmazonProductNormalized(
        asin=asin,
        marketplace=marketplace,
        title=structured.title or dom.title,
        brand=structured.brand or dom.brand,
        bullets=bullets,
        description=structured.description or dom.description,
        aplus_text=structured.aplus_text or dom.aplus_text,
        rating=structured.rating or dom.rating,
        reviews_count=structured.reviews_count or dom.reviews_count,
        price=structured.price or dom.price,
        main_image=structured.main_image or dom.main_image,
    )
    parser_used = _parser_used(structured=structured, dom=dom)
    return data, parser_used


def _merge_bullets(*groups: list[str]) -> list[str]:
    merged: list[str] = []
    seen: set[str] = set()
    for items in groups:
        for item in items:
            cleaned = " ".join(item.split()).strip()
            if not cleaned:
                continue
            key = cleaned.casefold()
            if key in seen:
                continue
            merged.append(cleaned)
            seen.add(key)
    return merged


def _parser_used(*, structured: ParsedAmazonData, dom: ParsedAmazonData) -> str:
    structured_values = any(
        [
            structured.title,
            structured.brand,
            structured.description,
            structured.main_image,
            structured.price,
            structured.rating,
            structured.reviews_count,
            structured.bullets,
        ]
    )
    dom_values = any(
        [
            dom.title,
            dom.brand,
            dom.description,
            dom.main_image,
            dom.price,
            dom.rating,
            dom.reviews_count,
            dom.bullets,
        ]
    )
    if structured_values and dom_values:
        return "hybrid"
    if structured_values:
        return "structured"
    if dom_values:
        return "dom"
    return "none"

