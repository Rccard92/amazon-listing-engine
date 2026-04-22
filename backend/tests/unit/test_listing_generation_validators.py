"""Test validatori e post-process deterministici (senza rete)."""

from app.schemas.listing_generation import InjectedRules
from app.services.listing_generation.post_process.keyword_strategy import post_process_backend_search_terms
from app.services.listing_generation.post_process.title import post_process_seo_title
from app.services.listing_generation.validation.bullets import validate_bullets
from app.services.listing_generation.validation.keyword_strategy import validate_backend_search_terms
from app.services.listing_generation.validation.title import validate_seo_title


def test_post_process_title_trims_to_max() -> None:
    long = "a" * 250
    out, applied = post_process_seo_title(long, max_chars=200)
    assert len(out) == 200
    assert "trimmed_to_max_chars" in applied


def test_validate_title_empty_is_error() -> None:
    r = validate_seo_title("", max_chars=200, rules=None)
    assert r.has_errors
    assert any(i.code == "empty_title" for i in r.issues)


def test_validate_bullets_wrong_count() -> None:
    r = validate_bullets(["a", "b"], rules=None)
    assert r.has_errors
    assert any(i.code == "bullets_count_not_five" for i in r.issues)


def test_keyword_post_process_dedup_and_truncate_bytes() -> None:
    raw = "casa casa casa wow offerta " + "x" * 300
    out, applied = post_process_backend_search_terms(raw, max_bytes=50, brand_tokens=[])
    assert len(out.encode("utf-8")) <= 50
    assert "truncated_to_max_bytes" in applied


def test_validate_search_terms_over_limit() -> None:
    big = "x" * 500
    r = validate_backend_search_terms(big, max_bytes=20)
    assert r.has_errors


def test_banned_phrase_in_title() -> None:
    rules = InjectedRules(banned_phrases=["vietato"])
    r = validate_seo_title("Titolo vietato qui", max_chars=200, rules=rules)
    assert any(i.code == "banned_phrase_present" for i in r.issues)
