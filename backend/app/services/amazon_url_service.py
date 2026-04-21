"""Utility URL Amazon: normalizzazione, ASIN e marketplace."""

import re
from dataclasses import dataclass
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse


class AmazonUrlError(ValueError):
    """Errore su URL Amazon non valido o non supportato."""


ASIN_RE = r"[A-Z0-9]{10}"
ASIN_PATTERNS = [
    re.compile(rf"/dp/({ASIN_RE})(?:[/?]|$)", re.IGNORECASE),
    re.compile(rf"/gp/product/({ASIN_RE})(?:[/?]|$)", re.IGNORECASE),
    re.compile(rf"/product/({ASIN_RE})(?:[/?]|$)", re.IGNORECASE),
]
MARKETPLACE_BY_HOST = {
    "amazon.com": "US",
    "amazon.it": "IT",
    "amazon.de": "DE",
    "amazon.fr": "FR",
    "amazon.es": "ES",
    "amazon.co.uk": "UK",
    "amazon.ca": "CA",
    "amazon.co.jp": "JP",
}
TRACKING_QUERY_PREFIXES = (
    "utm_",
    "tag",
    "ref",
    "pf_rd_",
    "pd_rd_",
    "psc",
    "qid",
    "sr",
    "keywords",
)


@dataclass(frozen=True)
class UrlAnalysis:
    """Risultato normalizzazione URL Amazon."""

    original_url: str
    normalized_url: str
    asin: str
    marketplace: str


def detect_marketplace(host: str) -> str:
    """Mappa dominio Amazon verso marketplace interno."""
    clean_host = host.lower().strip()
    if clean_host.startswith("www."):
        clean_host = clean_host[4:]
    if clean_host in MARKETPLACE_BY_HOST:
        return MARKETPLACE_BY_HOST[clean_host]
    raise AmazonUrlError("Marketplace Amazon non supportato per il dominio indicato.")


def extract_asin(url: str) -> str:
    """Estrae ASIN dai pattern URL Amazon principali."""
    parsed = urlparse(url)
    path = parsed.path or ""
    for pattern in ASIN_PATTERNS:
        match = pattern.search(path)
        if match:
            return match.group(1).upper()
    raise AmazonUrlError("ASIN non trovato nei pattern URL supportati.")


def normalize_amazon_url(url: str) -> str:
    """Canonizza URL Amazon rimuovendo query param di tracking."""
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        raise AmazonUrlError("URL non valido.")
    if parsed.scheme not in {"http", "https"}:
        raise AmazonUrlError("Schema URL non supportato.")

    host = parsed.netloc.lower()
    if host.startswith("www."):
        host = host[4:]
    _ = detect_marketplace(host)

    path = re.sub(r"/{2,}", "/", parsed.path or "/")
    path = path.rstrip("/") or "/"

    query_params = parse_qsl(parsed.query, keep_blank_values=False)
    filtered_params = [
        (k, v)
        for (k, v) in query_params
        if not any(k.lower().startswith(prefix) for prefix in TRACKING_QUERY_PREFIXES)
    ]
    query = urlencode(filtered_params, doseq=True)

    return urlunparse(("https", host, path, "", query, ""))


def analyze_amazon_url(url: str) -> UrlAnalysis:
    """Pipeline URL layer: normalize + asin + marketplace."""
    normalized = normalize_amazon_url(url)
    parsed = urlparse(normalized)
    return UrlAnalysis(
        original_url=url,
        normalized_url=normalized,
        asin=extract_asin(normalized),
        marketplace=detect_marketplace(parsed.netloc),
    )

