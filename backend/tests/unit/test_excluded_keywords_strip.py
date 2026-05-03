"""Post-process: rimozione keyword escluse."""

from app.services.listing_generation.post_process.excluded_keywords import strip_excluded_terms


def test_strip_single_word_case_insensitive() -> None:
    text, applied = strip_excluded_terms("Lampada LED da scrivania", ["led"])
    assert "led" not in text.lower()
    assert applied


def test_strip_multiword_phrase() -> None:
    text, applied = strip_excluded_terms("Organizer per cavi e accessori", ["per cavi"])
    assert "per cavi" not in text.lower()
    assert applied


def test_strip_no_match_returns_same() -> None:
    text, applied = strip_excluded_terms("Solo testo pulito", ["dyson"])
    assert text == "Solo testo pulito"
    assert not applied
