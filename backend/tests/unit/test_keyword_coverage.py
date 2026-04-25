from app.schemas.keyword_intelligence import KeywordClassificationItem, ConfirmedKeywordPlan
from app.schemas.keyword_planning import GeneratedFrontendContent
from app.services.listing_generation.keyword_coverage import remaining_backend_opportunities


def test_remaining_backend_opportunities_excludes_frontend_terms() -> None:
    plan = ConfirmedKeywordPlan(
        keyword_primaria_finale="organizer cavi",
        keyword_secondarie_prioritarie=["gestione cavi", "clip cavi adesive"],
        parole_da_tenere_per_backend=["porta cavi scrivania", "gestione cavi"],
    )
    frontend = GeneratedFrontendContent(
        seo_title="Organizer cavi per scrivania",
        bullets=["Gestione cavi ordinata e pulita"],
        description="Supporto compatto da ufficio.",
    )
    remaining = remaining_backend_opportunities(plan=plan, frontend_content=frontend)
    assert "gestione cavi" not in remaining
    assert "porta cavi scrivania" in remaining


def test_remaining_backend_opportunities_skips_excluded_and_verify() -> None:
    plan = ConfirmedKeywordPlan(
        keyword_primaria_finale="supporto monitor",
        keyword_secondarie_prioritarie=["compatibile vesa", "staffa monitor"],
        parole_da_tenere_per_backend=["supporto monitor ergonomico", "compatibile vesa", "staffa monitor"],
        classificazioni_confermate=[
            KeywordClassificationItem(
                keyword="compatibile vesa",
                category="VERIFY_PRODUCT_FEATURE",
                required_user_confirmation=True,
                recommended_usage="verify",
            )
        ],
        keyword_escluse_definitivamente=[
            KeywordClassificationItem(
                keyword="staffa monitor",
                category="OFF_TARGET",
                recommended_usage="exclude",
                excluded_reason_type="off_target",
            )
        ],
    )
    remaining = remaining_backend_opportunities(plan=plan, frontend_content=None)
    assert "compatibile vesa" not in remaining
    assert "staffa monitor" not in remaining
    assert "supporto monitor ergonomico" in remaining
