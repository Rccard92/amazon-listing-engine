from app.schemas.keyword_intelligence import KeywordIntelligenceRequest
from app.schemas.product_brief import ProductBrief
from app.schemas.strategic_enrichment import StrategicEnrichment
from app.services.keyword_intelligence import KeywordIntelligenceService


def test_keyword_intelligence_builds_profile_and_plan() -> None:
    service = KeywordIntelligenceService()
    brief = ProductBrief(
        nome_prodotto="Organizer cavi",
        categoria="Ufficio",
        keyword_primarie=["organizer cavi"],
        keyword_secondarie=["gestione cavi scrivania"],
        caratteristiche_specifiche=["alluminio", "base antiscivolo"],
    )
    enrichment = StrategicEnrichment(
        benefici_principali=["scrivania ordinata", "meno grovigli"],
        usp_differenziazione="struttura premium",
    )
    req = KeywordIntelligenceRequest(
        manual_seed_keywords=["clip cavi", "porta cavi ufficio"],
        helium10_rows=[{"keyword": "organizer cavi scrivania"}, {"keyword": "clip cavi adesive"}],
        uploaded_files=[{"filename": "helium.csv", "file_type": "csv"}],
    )
    out = service.run(brief=brief, enrichment=enrichment, request=req)
    assert out.product_intelligence_profile.product_detected == "Organizer cavi"
    assert out.keyword_classifications
    assert out.confirmed_keyword_plan.keyword_primaria_finale
    assert out.confirmed_keyword_plan.confirmed_by_user is True
    assert out.debug_trace is None


def test_keyword_intelligence_generates_clarification_without_category() -> None:
    service = KeywordIntelligenceService()
    brief = ProductBrief(nome_prodotto="Prodotto X", categoria=None)
    req = KeywordIntelligenceRequest(manual_seed_keywords=["ricambio compatibile x"], helium10_rows=[])
    out = service.run(brief=brief, enrichment=None, request=req)
    assert any(q.id == "category_confirm" for q in out.clarification_questions)


def test_keyword_intelligence_debug_trace_enabled() -> None:
    service = KeywordIntelligenceService()
    brief = ProductBrief(nome_prodotto="Prodotto Debug", categoria="Casa", keyword_primarie=["porta cavi"])
    req = KeywordIntelligenceRequest(
        manual_seed_keywords=["porta cavi"],
        helium10_rows=[{"keyword": "porta cavi scrivania"}],
        uploaded_files=[{"filename": "sample.csv", "file_type": "csv"}],
    )
    out = service.run_with_trace(
        brief=brief,
        enrichment=None,
        request=req,
        include_debug_trace=True,
    )
    assert out.debug_trace is not None
    assert out.debug_trace.step == "keyword_intelligence"
    assert out.debug_trace.data.decisions
