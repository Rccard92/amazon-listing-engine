"""Post-processing titolo SEO."""

from app.services.listing_generation.post_process.common import collapse_whitespace


def post_process_seo_title(raw: str, *, max_chars: int) -> tuple[str, list[str]]:
    applied: list[str] = []
    text = collapse_whitespace(raw)
    text = text.strip('"\'')

    if len(text) > max_chars:
        text = text[:max_chars].rstrip()
        applied.append("trimmed_to_max_chars")

    return text, applied
