"""Parser dati strutturati (JSON-LD / metadati) per pagina Amazon."""

import json
import re
from dataclasses import dataclass, field

from bs4 import BeautifulSoup


@dataclass
class ParsedAmazonData:
    """Contenitore campi parziali estratti dai parser."""

    title: str | None = None
    brand: str | None = None
    bullets: list[str] = field(default_factory=list)
    description: str | None = None
    aplus_text: str | None = None
    rating: float | None = None
    reviews_count: int | None = None
    price: float | None = None
    main_image: str | None = None


def parse_structured_data(html: str) -> ParsedAmazonData:
    """Estrae campi tramite script JSON-LD e meta."""
    soup = BeautifulSoup(html, "lxml")
    result = ParsedAmazonData()

    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        payload = script.string or script.text
        if not payload:
            continue
        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            continue
        candidates = data if isinstance(data, list) else [data]
        for candidate in candidates:
            if not isinstance(candidate, dict):
                continue
            if (candidate.get("@type") or "").lower() not in {"product", "aggregateoffer"}:
                continue
            result.title = result.title or _to_str(candidate.get("name"))
            result.description = result.description or _to_str(candidate.get("description"))
            brand = candidate.get("brand")
            if isinstance(brand, dict):
                result.brand = result.brand or _to_str(brand.get("name"))
            elif isinstance(brand, str):
                result.brand = result.brand or brand.strip()
            image = candidate.get("image")
            if isinstance(image, list) and image:
                result.main_image = result.main_image or _to_str(image[0])
            elif isinstance(image, str):
                result.main_image = result.main_image or image.strip()

            aggregate = candidate.get("aggregateRating")
            if isinstance(aggregate, dict):
                result.rating = result.rating or _to_float(aggregate.get("ratingValue"))
                result.reviews_count = result.reviews_count or _to_int(aggregate.get("reviewCount"))

            offers = candidate.get("offers")
            if isinstance(offers, dict):
                result.price = result.price or _to_price(offers.get("price"))

    result.title = result.title or _meta_content(soup, "title")
    result.main_image = result.main_image or _meta_content(soup, "og:image")
    return result


def _meta_content(soup: BeautifulSoup, key: str) -> str | None:
    tag = soup.find("meta", attrs={"property": key}) or soup.find("meta", attrs={"name": key})
    if not tag:
        return None
    content = tag.get("content")
    return content.strip() if isinstance(content, str) and content.strip() else None


def _to_str(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = value.strip()
    return cleaned or None


def _to_float(value: object) -> float | None:
    try:
        return float(str(value).strip())
    except (TypeError, ValueError):
        return None


def _to_int(value: object) -> int | None:
    if value is None:
        return None
    digits = re.sub(r"[^\d]", "", str(value))
    return int(digits) if digits else None


def _to_price(value: object) -> float | None:
    if value is None:
        return None
    norm = str(value).strip().replace(",", ".")
    norm = re.sub(r"[^0-9.]", "", norm)
    try:
        return float(norm)
    except ValueError:
        return None

