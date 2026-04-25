from app.schemas.keyword_intelligence import KeywordIntelligenceRequest
from app.schemas.analysis_exceptions import AnalysisPipelineError
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
    assert out.product_intelligence_profile.confidence_score > 0
    assert out.confirmed_keyword_plan.keyword_primaria_finale
    assert out.confirmed_keyword_plan.confirmed_by_user is False
    assert isinstance(out.confirmed_keyword_plan.keyword_escluse_definitivamente, list)
    assert out.rules_applied.startswith("keyword_intelligence_rules_")
    assert out.product_intelligence_profile.rules_version.startswith("keyword_intelligence_rules_")
    assert out.confirmed_keyword_plan.rules_version.startswith("keyword_intelligence_rules_")
    assert out.debug_trace is None


def test_keyword_intelligence_generates_clarification_without_category() -> None:
    service = KeywordIntelligenceService()
    brief = ProductBrief(nome_prodotto="Prodotto X", categoria=None)
    req = KeywordIntelligenceRequest(manual_seed_keywords=["ricambio compatibile x"], helium10_rows=[])
    out = service.run(brief=brief, enrichment=None, request=req)
    assert any(q.id == "category_confirm" for q in out.clarification_questions)
    assert any(item.required_user_confirmation for item in out.keyword_classifications)


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


def test_keyword_intelligence_sets_explicit_user_confirmation() -> None:
    service = KeywordIntelligenceService()
    brief = ProductBrief(nome_prodotto="Prodotto conferma", categoria="Casa", keyword_primarie=["supporto cavi"])
    req = KeywordIntelligenceRequest(
        manual_seed_keywords=["supporto cavi"],
        helium10_rows=[{"keyword": "supporto cavi da scrivania"}],
        confirm_plan_by_user=True,
    )
    out = service.run(brief=brief, enrichment=None, request=req)
    assert out.confirmed_keyword_plan.confirmed_by_user is True


def test_keyword_intelligence_excludes_competitor_and_off_target() -> None:
    service = KeywordIntelligenceService()
    brief = ProductBrief(nome_prodotto="Aspirapolvere verticale", categoria="Casa", keyword_primarie=["aspirapolvere"])
    req = KeywordIntelligenceRequest(
        helium10_rows=[
            {"keyword": "dyson aspirapolvere senza fili"},
            {"keyword": "ricambio filtro aspirapolvere"},
            {"keyword": "aspirapolvere senza filo potente"},
        ]
    )
    out = service.run(brief=brief, enrichment=None, request=req)
    excluded = {item.keyword: item.excluded_reason_type for item in out.confirmed_keyword_plan.keyword_escluse_definitivamente}
    assert "dyson aspirapolvere senza fili" in excluded
    assert excluded["dyson aspirapolvere senza fili"] == "competitor_brand"
    assert "ricambio filtro aspirapolvere" in excluded
    assert excluded["ricambio filtro aspirapolvere"] == "wrong_product_type"


def test_keyword_intelligence_does_not_promote_competitor_seed_to_primary() -> None:
    service = KeywordIntelligenceService()
    brief = ProductBrief(
        nome_prodotto="Supporto telefono auto",
        categoria="Auto",
        keyword_primarie=["nike supporto telefono", "supporto telefono auto"],
    )
    req = KeywordIntelligenceRequest(
        helium10_rows=[
            {"keyword": "nike supporto telefono"},
            {"keyword": "supporto telefono auto magnetico"},
        ]
    )
    out = service.run(brief=brief, enrichment=None, request=req)
    assert out.confirmed_keyword_plan.keyword_primaria_finale != "nike supporto telefono"
    excluded_keywords = [item.keyword for item in out.confirmed_keyword_plan.keyword_escluse_definitivamente]
    assert "nike supporto telefono" in excluded_keywords


def test_keyword_intelligence_keeps_excluded_and_verify_out_of_accepted_groups() -> None:
    service = KeywordIntelligenceService()
    brief = ProductBrief(
        nome_prodotto="Lampada scrivania led",
        categoria="Illuminazione",
        keyword_primarie=["lampada scrivania led"],
    )
    req = KeywordIntelligenceRequest(
        helium10_rows=[
            {"keyword": "lampada scrivania led"},
            {"keyword": "adatto a dyson base"},
            {"keyword": "ricambio lampada vintage"},
            {"keyword": "compatibile con ikea desk"},
            {"keyword": "lampada led ufficio regolabile"},
        ]
    )
    out = service.run(brief=brief, enrichment=None, request=req)
    blocked = {item.keyword for item in out.confirmed_keyword_plan.keyword_escluse_definitivamente}
    blocked.update(
        item.keyword
        for item in out.confirmed_keyword_plan.classificazioni_confermate
        if item.category == "VERIFY_PRODUCT_FEATURE" or item.required_user_confirmation
    )
    assert all(keyword not in blocked for keyword in out.confirmed_keyword_plan.parole_da_spingere_nel_frontend)
    assert all(keyword not in blocked for keyword in out.confirmed_keyword_plan.parole_da_tenere_per_backend)


def test_keyword_intelligence_three_layer_pipeline_metadata(monkeypatch) -> None:
    monkeypatch.setenv("ENABLE_KEYWORD_THREE_LAYER", "true")
    monkeypatch.setenv("ENABLE_KEYWORD_AI_CONTEXT_BUILDER", "false")
    monkeypatch.setenv("ENABLE_KEYWORD_AI_REFINEMENT", "false")
    from app.core import config

    config.get_settings.cache_clear()
    service = KeywordIntelligenceService()
    brief = ProductBrief(
        nome_prodotto="Tagliere bamboo",
        categoria="Cucina",
        keyword_primarie=["tagliere bamboo"],
    )
    req = KeywordIntelligenceRequest(
        helium10_rows=[
            {"keyword": "tagliere bamboo cucina"},
            {"keyword": "nike tagliere bamboo"},
            {"keyword": "ricambio tagliere bamboo"},
        ],
        pipeline_mode="three_layer",
        enable_deterministic_veto=True,
    )
    out = service.run(brief=brief, enrichment=None, request=req)
    assert out.pipeline_applied == "three_layer"
    assert out.keyword_context is not None
    assert out.veto_summary is not None
    assert out.confirmed_keyword_plan.pipeline_metadata is not None
    assert out.confirmed_keyword_plan.pipeline_metadata["deterministic_veto"] is True


def test_keyword_intelligence_forensic_trace_enabled(monkeypatch) -> None:
    monkeypatch.setenv("ENABLE_KEYWORD_THREE_LAYER", "true")
    monkeypatch.setenv("ENABLE_KEYWORD_AI_CONTEXT_BUILDER", "false")
    monkeypatch.setenv("ENABLE_KEYWORD_AI_REFINEMENT", "false")
    monkeypatch.setenv("KEYWORD_FORENSIC_DEBUG_ENABLED", "true")
    from app.core import config

    config.get_settings.cache_clear()
    service = KeywordIntelligenceService()
    brief = ProductBrief(nome_prodotto="Barbecue gas", categoria="Giardino", keyword_primarie=["barbecue gas"])
    req = KeywordIntelligenceRequest(
        include_debug_trace=True,
        include_forensic_trace=True,
        pipeline_mode="three_layer",
        enable_deterministic_veto=True,
        forensic_fingerprint="fp_test",
        forensic_input_meta={"saved_fingerprint": "fp_old"},
        helium10_rows=[
            {"keyword": "weber barbecue a gas"},
            {"keyword": "barbecue a pellet da esterno"},
            {"keyword": "barbecue gas da esterno"},
        ],
    )
    out = service.run_with_trace(brief=brief, enrichment=None, request=req, include_debug_trace=True)
    assert out.forensic_trace is not None
    assert out.analysis_run_id is not None
    assert out.analysis_started_at is not None
    assert out.analysis_finished_at is not None
    assert out.forensic_trace["pipeline_mode"] == "three_layer"
    assert out.forensic_trace["analysis_run_id"] == out.analysis_run_id
    assert "route_called" in out.forensic_trace
    assert "openai_client_called" in out.forensic_trace
    assert "reason_if_ai_not_called" in out.forensic_trace
    assert "reason_if_fallback_used" in out.forensic_trace
    assert "stage_outcomes" in out.forensic_trace
    assert "keywords_debug_map" in out.forensic_trace
    explicit_cases = out.forensic_trace["explicit_debug_cases"]
    assert isinstance(explicit_cases, list)
    assert any(case["keyword"] == "weber barbecue a gas" for case in explicit_cases)
    assert any(case["keyword"] == "barbecue a pellet da esterno" for case in explicit_cases)
    for case in explicit_cases:
        assert "normalized_keyword" in case
        assert "competitor_brand_match" in case
        assert "forbidden_concept_match" in case
        assert "uncertain_attribute_match" in case
        assert "veto_result" in case
        assert "refinement_result" in case
        assert "final_bucket" in case
        assert "final_reason" in case


def test_keyword_intelligence_run_id_changes_between_runs() -> None:
    service = KeywordIntelligenceService()
    brief = ProductBrief(nome_prodotto="Organizer cucina", categoria="Cucina", keyword_primarie=["organizer cucina"])
    req = KeywordIntelligenceRequest(
        helium10_rows=[{"keyword": "organizer cucina cassetto"}],
        include_debug_trace=False,
    )
    out_a = service.run(brief=brief, enrichment=None, request=req)
    out_b = service.run(brief=brief, enrichment=None, request=req)
    assert out_a.analysis_run_id is not None
    assert out_b.analysis_run_id is not None
    assert out_a.analysis_run_id != out_b.analysis_run_id


def test_keyword_intelligence_fails_when_ai_required_but_not_executed(monkeypatch) -> None:
    monkeypatch.setenv("ENABLE_KEYWORD_THREE_LAYER", "true")
    monkeypatch.setenv("ENABLE_KEYWORD_AI_CONTEXT_BUILDER", "false")
    monkeypatch.setenv("ENABLE_KEYWORD_AI_REFINEMENT", "false")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    from app.core import config

    config.get_settings.cache_clear()
    service = KeywordIntelligenceService()
    brief = ProductBrief(nome_prodotto="Barbecue gas", categoria="Giardino", keyword_primarie=["barbecue gas"])
    req = KeywordIntelligenceRequest(
        pipeline_mode="three_layer",
        enable_ai_context_builder=True,
        enable_ai_refinement=True,
        require_ai_execution=True,
        helium10_rows=[{"keyword": "barbecue gas da esterno"}],
    )
    try:
        service.run(brief=brief, enrichment=None, request=req)
        assert False, "Atteso AnalysisPipelineError quando AI richiesta ma non eseguita"
    except AnalysisPipelineError as exc:
        assert exc.message_it == "Motore AI non disponibile"


def test_keyword_intelligence_marks_valid_ai_run_when_context_ai_executed(monkeypatch) -> None:
    monkeypatch.setenv("ENABLE_KEYWORD_THREE_LAYER", "true")
    monkeypatch.setenv("ENABLE_KEYWORD_AI_CONTEXT_BUILDER", "true")
    monkeypatch.setenv("ENABLE_KEYWORD_AI_REFINEMENT", "false")
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    from app.core import config

    config.get_settings.cache_clear()
    service = KeywordIntelligenceService()
    brief = ProductBrief(nome_prodotto="Barbecue gas", categoria="Giardino", keyword_primarie=["barbecue gas"])
    req = KeywordIntelligenceRequest(
        pipeline_mode="three_layer",
        enable_ai_context_builder=True,
        require_ai_execution=True,
        helium10_rows=[{"keyword": "barbecue gas da esterno"}],
    )

    original_build = service._context_builder.build

    def _fake_build(*args, **kwargs):  # type: ignore[no-untyped-def]
        out = original_build(*args, **kwargs)
        service._context_builder.last_forensic_trace = {
            "executed": True,
            "openai_called": True,
            "fallback_used": False,
            "fallback_reason": None,
            "model_name": "gpt-test",
        }
        return out

    service._context_builder.build = _fake_build  # type: ignore[method-assign]
    out = service.run(brief=brief, enrichment=None, request=req)
    assert out.valid_ai_run is True
    assert out.final_source_of_truth == "ai"
    assert out.model_name == "gpt-test"
