from app.schemas.keyword_intelligence import ConfirmedKeywordPlan
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
