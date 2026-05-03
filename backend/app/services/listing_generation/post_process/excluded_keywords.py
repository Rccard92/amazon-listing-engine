"""Rimozione deterministica di keyword escluse dal testo generato."""

from __future__ import annotations

import re


def strip_excluded_terms(text: str, excluded: list[str]) -> tuple[str, list[str]]:
    """
    Rimuove le frasi in `excluded` da `text` (case-insensitive).
    Termini senza spazi: word boundary; con spazi: sottostringa.
    """
    if not text or not excluded:
        return text, []

    applied: list[str] = []
    out = text
    terms = sorted({str(t).strip() for t in excluded if str(t).strip()}, key=len, reverse=True)

    for term in terms:
        pattern = _removal_pattern(term)
        new_out, n = pattern.subn(" ", out)
        if n > 0:
            applied.append(f"stripped_excluded:{term[:48]}")
        out = new_out

    out = re.sub(r"\s+", " ", out).strip()
    return out, applied


def _removal_pattern(term: str) -> re.Pattern[str]:
    if " " in term:
        return re.compile(re.escape(term), re.IGNORECASE)
    return re.compile(rf"\b{re.escape(term)}\b", re.IGNORECASE)
