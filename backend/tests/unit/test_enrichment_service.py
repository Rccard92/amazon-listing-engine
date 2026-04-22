from app.schemas.product_brief import ProductBrief
from app.services.strategic_enrichment.enrichment_service import StrategicEnrichmentService


class _FakeLLM:
    def generate_text(self, **kwargs: object) -> str:
        return (
            '{"benefici_principali": ["Ordine in scrivania"], '
            '"usp_differenziazione": "Compatto", '
            '"target_cliente": "Smart worker", '
            '"gestione_obiezioni": ["Poco spazio"], '
            '"angolo_emotivo": "Controllo"}'
        )


def test_strategic_enrichment_service_parses_llm_json() -> None:
    svc = StrategicEnrichmentService(llm=_FakeLLM())
    out = svc.enrich(ProductBrief(nome_prodotto="Organizer", brand="Meridiana"))
    assert out.benefici_principali == ["Ordine in scrivania"]
    assert out.usp_differenziazione == "Compatto"
    assert out.enrichment_provenance == "llm_v1"
