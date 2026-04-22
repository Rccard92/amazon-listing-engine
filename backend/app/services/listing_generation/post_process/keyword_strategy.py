"""Post-processing search terms backend."""

from __future__ import annotations

from app.services.listing_generation.post_process.common import collapse_whitespace, truncate_utf8_bytes

# Parole troppo generiche / marketing da deprioritizzare (MVP)
_GENERIC_MARKETING_IT = frozenset(
    {
        "migliore",
        "migliori",
        "top",
        "wow",
        "incredibile",
        "fantastico",
        "gratis",
        "regalo",
        "offerta",
        "occasione",
        "esclusivo",
        "unico",
        "numero1",
        "#1",
    }
)


def post_process_backend_search_terms(
    raw: str,
    *,
    max_bytes: int,
    brand_tokens: list[str] | None = None,
) -> tuple[str, list[str]]:
    applied: list[str] = []
    text = collapse_whitespace(raw).lower()
    parts = text.split()
    brand_lower = {b.lower() for b in (brand_tokens or []) if len(b) >= 3}

    deduped: list[str] = []
    seen: set[str] = set()
    for p in parts:
        token = p.strip()
        if not token:
            continue
        if token in _GENERIC_MARKETING_IT:
            applied.append("filtered_generic_term")
            continue
        if token in seen:
            continue
        seen.add(token)
        deduped.append(token)

    # Rimuovi ripetizioni brand se compare troppe volte (semplificato: una sola occorrenza)
    if brand_lower:
        brand_hits = 0
        filtered: list[str] = []
        for t in deduped:
            if t in brand_lower:
                brand_hits += 1
                if brand_hits > 1:
                    applied.append("deduped_brand_token")
                    continue
            filtered.append(t)
        deduped = filtered

    out = " ".join(deduped)
    out, truncated = truncate_utf8_bytes(out, max_bytes)
    if truncated:
        applied.append("truncated_to_max_bytes")
    return out, applied
