"""Validazione search terms backend."""

from app.schemas.listing_generation import ValidationIssue, ValidationReport


def validate_backend_search_terms(text: str, *, max_bytes: int) -> ValidationReport:
    issues: list[ValidationIssue] = []
    if not text.strip():
        issues.append(
            ValidationIssue(
                code="empty_search_terms",
                severity="error",
                message_it="Le search terms sono vuote.",
                field="backend_search_terms",
            )
        )
        return ValidationReport(issues=issues)
    raw_len = len(text.encode("utf-8"))
    if raw_len > max_bytes:
        issues.append(
            ValidationIssue(
                code="search_terms_over_byte_limit",
                severity="error",
                message_it=f"Le search terms superano {max_bytes} byte (attuali ~{raw_len}).",
                field="backend_search_terms",
            )
        )
    elif raw_len > int(max_bytes * 0.88):
        issues.append(
            ValidationIssue(
                code="search_terms_near_byte_limit",
                severity="info",
                message_it="Testo vicino al limite byte; verifica su Seller Central.",
                field="backend_search_terms",
            )
        )
    if any(c in text for c in "\n\r\t"):
        issues.append(
            ValidationIssue(
                code="search_terms_multiline",
                severity="warning",
                message_it="Le search terms dovrebbero essere su una sola riga.",
                field="backend_search_terms",
            )
        )
    if "," in text:
        issues.append(
            ValidationIssue(
                code="search_terms_commas",
                severity="warning",
                message_it="Per lo stile backend Amazon IT preferisci termini separati da spazio, non virgole.",
                field="backend_search_terms",
            )
        )
    return ValidationReport(issues=issues)
