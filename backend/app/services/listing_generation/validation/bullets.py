"""Validazione bullet points."""

from app.schemas.listing_generation import InjectedRules, ValidationIssue, ValidationReport

from app.services.listing_generation.validation.common import (
    detect_keyword_stuffing,
    merge_reports,
    validate_banned_phrases,
)


def validate_bullets(
    bullets: list[str],
    *,
    rules: InjectedRules | None,
) -> ValidationReport:
    issues: list[ValidationIssue] = []
    if len(bullets) != 5:
        issues.append(
            ValidationIssue(
                code="bullets_count_not_five",
                severity="error",
                message_it=f"Servono esattamente 5 bullet; ne hai {len(bullets)}.",
                field="bullets",
            )
        )
    for i, b in enumerate(bullets):
        if len(b.strip()) < 20:
            issues.append(
                ValidationIssue(
                    code="bullet_too_short",
                    severity="warning",
                    message_it=f"Il bullet {i + 1} è molto corto.",
                    field=f"bullets.{i}",
                )
            )
    joined = " ".join(bullets)
    banned = list(rules.banned_phrases) if rules else []
    stuffing = detect_keyword_stuffing(joined, max_single_word_ratio=0.22, min_tokens=12)
    return merge_reports(
        ValidationReport(issues=issues),
        ValidationReport(issues=validate_banned_phrases(joined, banned)),
        ValidationReport(issues=stuffing),
    )
