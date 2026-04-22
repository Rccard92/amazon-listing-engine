"""Mapping strategia confermata da work item input."""

from app.schemas.product_ai_analysis import ProductStrategyDraft
from app.services.listing_generation.strategy_from_draft import (
    confirmed_from_draft_and_user,
    confirmed_strategy_from_work_item_input,
)


def test_confirmed_from_draft_and_user_merges_ur() -> None:
    draft = ProductStrategyDraft(
        normalized_product_name="Nome AI",
        evident_keywords=["a", "b", "c", "d"],
        inferred_price_tier="premium",
    )
    out = confirmed_from_draft_and_user(
        draft,
        user_required={
            "brand_guidelines": "Mai gridare",
            "unique_selling_points": "USP utente",
            "target_price_level": "economico",
        },
        user_confirmation={},
        auto_extracted={},
    )
    assert out.nome_prodotto == "Nome AI"
    assert out.usp_differenziazione == "USP utente"
    assert "Mai gridare" in (out.linee_guida_brand or "")
    assert out.livello_prezzo == "entry"
    assert len(out.keyword_primarie) >= 1


def test_confirmed_strategy_from_work_item_input_prefers_manual_block() -> None:
    inp = {
        "manual_product_strategy": {
            "nome_prodotto": "Manuale",
            "categoria": "Casa",
            "caratteristiche_tecniche": [],
            "benefici_principali": ["b1"],
            "usp_differenziazione": None,
            "target_cliente": None,
            "gestione_obiezioni": [],
            "insight_recensioni_clienti": None,
            "keyword_primarie": ["k1"],
            "keyword_secondarie": [],
            "linee_guida_brand": None,
            "angolo_emotivo": None,
            "livello_prezzo": "mid",
        },
        "ai_strategy_draft": {
            "normalized_product_name": "AI",
            "technical_features": [],
            "main_benefits": [],
            "strengths": [],
            "probable_objections": [],
            "evident_keywords": [],
            "user_confirmation_fields": [],
            "missing_information": [],
            "confidence_notes": [],
        },
    }
    s = confirmed_strategy_from_work_item_input(inp)
    assert s.nome_prodotto == "Manuale"
    assert s.livello_prezzo == "mid"


def test_confirmed_strategy_from_work_item_input_minimal() -> None:
    inp = {
        "ai_strategy_draft": {
            "normalized_product_name": "X",
            "technical_features": [],
            "main_benefits": [],
            "strengths": [],
            "probable_objections": [],
            "evident_keywords": ["k1"],
            "user_confirmation_fields": [],
            "missing_information": [],
            "confidence_notes": [],
        },
        "auto_extracted": {"title": "Fallback titolo"},
        "user_required": {},
        "user_confirmation": {},
    }
    s = confirmed_strategy_from_work_item_input(inp)
    assert s.nome_prodotto == "X"
