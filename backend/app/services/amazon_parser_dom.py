"""Parser DOM fallback per pagina Amazon."""

import re

from bs4 import BeautifulSoup

from app.services.amazon_parser_structured import ParsedAmazonData


def parse_dom_fallback(html: str) -> ParsedAmazonData:
    """Fallback parser basato su selettori DOM."""
    soup = BeautifulSoup(html, "lxml")
    result = ParsedAmazonData()

    result.title = _text_by_id(soup, "productTitle")
    result.brand = _text_by_id(soup, "bylineInfo")
    result.bullets = _bullets(soup)
    result.description = _text_by_id(soup, "productDescription")
    result.aplus_text = _aplus_text(soup)
    result.rating = _parse_float(_text_by_css(soup, "span[data-hook='rating-out-of-text']"))
    result.reviews_count = _parse_int(_text_by_id(soup, "acrCustomerReviewText"))
    result.price = _price(soup)
    result.main_image = _main_image(soup)
    return result


def _text_by_id(soup: BeautifulSoup, id_name: str) -> str | None:
    tag = soup.find(id=id_name)
    if tag:
        value = tag.get_text(" ", strip=True)
        return value or None
    return None


def _text_by_css(soup: BeautifulSoup, selector: str) -> str | None:
    tag = soup.select_one(selector)
    if tag:
        value = tag.get_text(" ", strip=True)
        return value or None
    return None


def _bullets(soup: BeautifulSoup) -> list[str]:
    items = []
    for li in soup.select("#feature-bullets ul li"):
        txt = li.get_text(" ", strip=True)
        if txt:
            items.append(txt)
    return items


def _aplus_text(soup: BeautifulSoup) -> str | None:
    sections = soup.select("#aplus p, #aplus span")
    chunks = [sec.get_text(" ", strip=True) for sec in sections if sec.get_text(" ", strip=True)]
    if not chunks:
        return None
    return " ".join(chunks)


def _price(soup: BeautifulSoup) -> float | None:
    raw = _text_by_css(soup, "span.a-price span.a-offscreen") or _text_by_id(soup, "priceblock_ourprice")
    if not raw:
        return None
    cleaned = re.sub(r"[^0-9,.\-]", "", raw).replace(",", ".")
    cleaned = re.sub(r"\.(?=.*\.)", "", cleaned)
    try:
        return float(cleaned)
    except ValueError:
        return None


def _main_image(soup: BeautifulSoup) -> str | None:
    img = soup.find(id="landingImage") or soup.select_one("#imgTagWrapperId img")
    if not img:
        return None
    src = img.get("src")
    if isinstance(src, str) and src.strip():
        return src.strip()
    return None


def _parse_float(text: str | None) -> float | None:
    if not text:
        return None
    normalized = text.replace(",", ".")
    match = re.search(r"\d+(?:\.\d+)?", normalized)
    return float(match.group(0)) if match else None


def _parse_int(text: str | None) -> int | None:
    if not text:
        return None
    digits = re.sub(r"[^\d]", "", text)
    return int(digits) if digits else None

