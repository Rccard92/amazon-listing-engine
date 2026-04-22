"""Validazione descrizione."""

from app.schemas.listing_generation import InjectedRules, ValidationIssue, ValidationReport

from app.services.listing_generation.validation.common import (
    detect_keyword_stuffing,
    merge_reports,
    validate_banned_phrases,
)


def validate_description(
    description: str,
    *,
    min_chars: int,
    max_chars: int,
    rules: InjectedRules | None,
) -> ValidationReport:
    issues: list[ValidationIssue] = []
    n = len(description.strip())
    if n < min_chars:
        issues.append(
            ValidationIssue(
                code="description_under_min",
                severity="warning",
                message_it=f"La descrizione è sotto i {min_chars} caratteri consigliati.",
                field="description",
            )
        )
    if n > max_chars:
        issues.append(
            ValidationIssue(
                code="description_over_max",
                severity="error",
                message_it=f"La descrizione supera {max_chars} caratteri.",
                field="description",
            )
        )
    banned = list(rules.banned_phrases) if rules else []
    stuffing = detect_keyword_stuffing(description, max_single_word_ratio=0.12, min_tokens=20)
    return merge_reports(
        ValidationReport(issues=issues),
        ValidationReport(issues=validate_banned_phrases(description, banned)),
        ValidationReport(issues=stuffing),
    )
