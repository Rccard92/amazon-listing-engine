"""Post-processing descrizione."""

from app.services.listing_generation.post_process.common import normalize_paragraphs


def post_process_description(raw: str) -> tuple[str, list[str]]:
    applied: list[str] = []
    text = normalize_paragraphs(raw)
    if text != raw.strip():
        applied.append("normalized_paragraphs")
    return text, applied
