from app.schemas.product_brief import ProductBrief
from app.schemas.strategic_enrichment import StrategicEnrichment
from app.services.manual_workflow.assemble_strategy import assemble_confirmed_strategy


def test_assemble_merges_brand_and_enrichment() -> None:
    brief = ProductBrief(
        nome_prodotto="Organizer",
        categoria="Ufficio",
        brand="Meridiana",
        keyword_primarie=["scrivania"],
        keyword_secondarie=["cavi"],
        livello_prezzo="entry",
    )
    enr = StrategicEnrichment(
        benefici_principali=["Ordine"],
        usp_differenziazione="Compatto",
        target_cliente="Smart worker",
        gestione_obiezioni=["Poco spazio"],
        angolo_emotivo="Controllo",
    )
    s = assemble_confirmed_strategy(brief, enr)
    assert s.nome_prodotto == "Organizer"
    assert s.benefici_principali == ["Ordine"]
    assert s.linee_guida_brand and "Meridiana" in s.linee_guida_brand


def test_assemble_dettagli_become_tech_lines() -> None:
    brief = ProductBrief(
        nome_prodotto="X",
        dettagli_articolo="riga uno\nriga due",
    )
    s = assemble_confirmed_strategy(brief, None)
    assert "riga uno" in s.caratteristiche_tecniche
    assert "riga due" in s.caratteristiche_tecniche
