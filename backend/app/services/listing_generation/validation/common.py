"""Euristiche condivise (keyword stuffing, ecc.)."""

from __future__ import annotations

import re
from collections import Counter

from app.schemas.listing_generation import ValidationIssue, ValidationReport


def _tokenize_words(text: str) -> list[str]:
    return re.findall(r"\w+", text.lower())


def detect_keyword_stuffing(
    text: str,
    *,
    max_single_word_ratio: float,
    min_tokens: int = 6,
) -> list[ValidationIssue]:
    """Segnala se una parola lunga domina il testo (rapporto su token)."""
    words = _tokenize_words(text)
    if len(words) < min_tokens:
        return []
    counts = Counter(w for w in words if len(w) >= 4)
    issues: list[ValidationIssue] = []
    for word, n in counts.items():
        ratio = n / len(words)
        if ratio > max_single_word_ratio:
            issues.append(
                ValidationIssue(
                    code="keyword_repeat_ratio_high",
                    severity="warning",
                    message_it=f"La parola «{word}» compare spesso: possibile keyword stuffing.",
                    field=None,
                )
            )
    return issues


def validate_banned_phrases(text: str, banned: list[str]) -> list[ValidationIssue]:
    issues: list[ValidationIssue] = []
    lower = text.lower()
    for phrase in banned:
        p = phrase.strip().lower()
        if not p:
            continue
        if p in lower:
            issues.append(
                ValidationIssue(
                    code="banned_phrase_present",
                    severity="warning",
                    message_it=f"È presente un termine da evitare: «{phrase}».",
                    field=None,
                )
            )
    return issues


def merge_reports(*reports: ValidationReport) -> ValidationReport:
    issues: list[ValidationIssue] = []
    for r in reports:
        issues.extend(r.issues)
    return ValidationReport(issues=issues)
