"""Normalizzazione piano keyword confermato."""

from app.schemas.keyword_intelligence import ConfirmedKeywordPlan, KeywordClassificationItem
from app.services.keyword_intelligence.plan_canonical import normalize_confirmed_keyword_plan


def test_normalize_fills_included_from_legacy_lists() -> None:
    plan = ConfirmedKeywordPlan(
        parole_da_spingere_nel_frontend=["Lampada LED"],
        parole_da_tenere_per_backend=["luce scrivania"],
        keyword_escluse_definitivamente=[],
    )
    out = normalize_confirmed_keyword_plan(plan)
    assert out.included_keywords == ["Lampada LED", "luce scrivania"]
    assert out.excluded_keywords == []


def test_normalize_excludes_blocked_and_dedupes() -> None:
    plan = ConfirmedKeywordPlan(
        parole_da_spingere_nel_frontend=["foo", "bar"],
        parole_da_tenere_per_backend=["FOO", "baz"],
        keyword_escluse_definitivamente=[
            KeywordClassificationItem(
                keyword="bar",
                category="OFF_TARGET",
                recommended_usage="exclude",
            )
        ],
    )
    out = normalize_confirmed_keyword_plan(plan)
    assert "bar" not in [k.lower() for k in out.included_keywords]
    assert "foo" in [k.lower() for k in out.included_keywords]
    assert "baz" in [k.lower() for k in out.included_keywords]
    assert any(k.lower() == "bar" for k in out.excluded_keywords)


def test_normalize_fallback_to_primary_and_secondary() -> None:
    plan = ConfirmedKeywordPlan(
        keyword_primaria_finale="primus",
        keyword_secondarie_prioritarie=["secundus"],
        parole_da_spingere_nel_frontend=[],
        parole_da_tenere_per_backend=[],
    )
    out = normalize_confirmed_keyword_plan(plan)
    assert out.included_keywords == ["primus", "secundus"]
