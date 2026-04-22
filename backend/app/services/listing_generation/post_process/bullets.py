"""Post-processing bullet list."""

from app.services.listing_generation.post_process.common import strip_leading_bullet_markers


def post_process_bullets(lines: list[str]) -> tuple[list[str], list[str]]:
    applied: list[str] = []
    out: list[str] = []
    for raw in lines:
        cleaned = strip_leading_bullet_markers(raw.strip())
        if cleaned:
            out.append(cleaned)
    if len(lines) != len(out):
        applied.append("dropped_empty_bullets")
    return out, applied
