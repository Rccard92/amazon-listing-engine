"""Contesto assemblato per Brief Creativo."""

from app.services.creative_brief.context import build_creative_brief_user_prompt
from app.services.listing_generation.strategy_from_draft import PRODUCT_BRIEF_KEY, STRATEGIC_ENRICHMENT_KEY


def test_creative_brief_user_prompt_lists_generated_title() -> None:
    input_data = {
        PRODUCT_BRIEF_KEY: {
            "nome_prodotto": "Lampada test",
            "categoria": None,
            "brand": "Meridiana",
            "descrizione_attuale": None,
            "bullet_attuali": [],
            "caratteristiche_specifiche": [],
            "dettagli_articolo": None,
            "dettagli_aggiuntivi": None,
            "riassunto_ai_recensioni": None,
            "keyword_primarie": [],
            "keyword_secondarie": [],
            "livello_prezzo": "mid",
            "linee_guida_brand": None,
            "note_utente": None,
        },
        STRATEGIC_ENRICHMENT_KEY: {
            "benefici_principali": [],
            "usp_differenziazione": None,
            "target_cliente": None,
            "gestione_obiezioni": [],
            "angolo_emotivo": None,
            "enrichment_provenance": "test",
        },
    }
    generated_output = {
        "listing_generation": {
            "sections": {
                "seo_title": {"seo_title": "Titolo SEO sintetico"},
            }
        }
    }
    text = build_creative_brief_user_prompt(input_data=input_data, generated_output=generated_output)
    assert "Titolo SEO sintetico" in text
    assert "Lampada test" in text
