"""Validazione titolo SEO."""

from app.schemas.listing_generation import InjectedRules, ValidationIssue, ValidationReport

from app.services.listing_generation.validation.common import (
    detect_keyword_stuffing,
    merge_reports,
    validate_banned_phrases,
)


def validate_seo_title(
    title: str,
    *,
    max_chars: int,
    rules: InjectedRules | None,
) -> ValidationReport:
    issues: list[ValidationIssue] = []
    if not title.strip():
        issues.append(
            ValidationIssue(
                code="empty_title",
                severity="error",
                message_it="Il titolo è vuoto.",
                field="seo_title",
            )
        )
        return ValidationReport(issues=issues)
    if len(title) > max_chars:
        issues.append(
            ValidationIssue(
                code="title_over_max_chars",
                severity="error",
                message_it=f"Il titolo supera {max_chars} caratteri.",
                field="seo_title",
            )
        )
    banned = list(rules.banned_phrases) if rules else []
    stuffing = detect_keyword_stuffing(title, max_single_word_ratio=0.35, min_tokens=4)
    return merge_reports(
        ValidationReport(issues=issues),
        ValidationReport(issues=validate_banned_phrases(title, banned)),
        ValidationReport(issues=stuffing),
    )
