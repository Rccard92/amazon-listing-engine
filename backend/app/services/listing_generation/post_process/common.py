"""Utilità condivise post-processing."""

import re


def collapse_whitespace(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def normalize_paragraphs(text: str) -> str:
    lines = [ln.strip() for ln in text.splitlines()]
    blocks: list[str] = []
    current: list[str] = []
    for ln in lines:
        if not ln:
            if current:
                blocks.append(" ".join(current))
                current = []
            continue
        current.append(ln)
    if current:
        blocks.append(" ".join(current))
    return "\n\n".join(blocks).strip()


def truncate_utf8_bytes(text: str, max_bytes: int) -> tuple[str, bool]:
    """Ritorna (testo, True se troncato)."""
    encoded = text.encode("utf-8")
    if len(encoded) <= max_bytes:
        return text, False
    truncated = encoded[:max_bytes]
    while truncated and (truncated[-1] & 0b11000000) == 0b10000000:
        truncated = truncated[:-1]
    out = truncated.decode("utf-8", errors="strict").rstrip()
    return out, True


def strip_leading_bullet_markers(line: str) -> str:
    return re.sub(r"^[\s•\-\*\d\.\)]+\s*", "", line).strip()
