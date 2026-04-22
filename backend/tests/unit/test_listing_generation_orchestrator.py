"""Orchestrator con LLM fittizio."""

from dataclasses import dataclass, field

import pytest

from app.schemas.analysis_exceptions import AnalysisPipelineError
from app.schemas.confirmed_product_strategy import ConfirmedProductStrategy
from app.schemas.listing_generation import GenerateListingSectionRequest, InjectedRules
from app.services.listing_generation.llm_client import ListingLLMClient
from app.services.listing_generation.orchestrator import ListingGenerationOrchestratorService


@dataclass
class FakeLLM:
    responses: dict[str, str] = field(default_factory=dict)
    default: str = ""

    def generate_text(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        max_output_tokens: int = 2048,
    ) -> str:
        # key by section hints in user prompt (MVP test hook)
        if "Rispondi solo con il titolo" in user_prompt:
            return self.responses.get("seo_title", self.default) or "Titolo SEO di test per prodotto"
        if '"bullets"' in system_prompt or "bullets" in user_prompt.lower():
            return self.responses.get(
                "bullet_points",
                '{"bullets": ["Uno beneficio", "Due supporto", "Tre qualità", "Quattro uso", "Cinque garanzia"]}',
            )
        if "descrizione finale" in user_prompt.lower() or "Target lunghezza" in user_prompt:
            return self.responses.get("description", "Paragrafo uno.\n\nParagrafo due.\n\nParagrafo tre.") * 5
        if "search terms" in system_prompt.lower() or "Limite approssimativo" in user_prompt:
            return self.responses.get("keyword_strategy", "termine uno due tre quattro")
        return self.default


def _strategy() -> ConfirmedProductStrategy:
    return ConfirmedProductStrategy(
        nome_prodotto="Lampada LED scrivania",
        categoria="Illuminazione",
        caratteristiche_tecniche=["10W", "USB-C"],
        benefici_principali=["Luce uniforme", "Regolabile"],
        usp_differenziazione="Design compatto",
        target_cliente="Studenti e smart worker",
        gestione_obiezioni=["Luminosità percepita"],
        keyword_primarie=["lampada led scrivania"],
        keyword_secondarie=["luce calda"],
        livello_prezzo="mid",
    )


def test_orchestrator_title_section() -> None:
    fake = FakeLLM()
    svc = ListingGenerationOrchestratorService(llm=fake)
    req = GenerateListingSectionRequest(
        strategy=_strategy(),
        section="seo_title",
        rules=InjectedRules(),
        include_raw_model_text=True,
    )
    out = svc.generate(req)
    assert out.section == "seo_title"
    assert out.seo_title
    assert out.raw_model_text


def test_orchestrator_bullets_json() -> None:
    svc = ListingGenerationOrchestratorService(llm=FakeLLM())
    out = svc.generate(
        GenerateListingSectionRequest(strategy=_strategy(), section="bullet_points"),
    )
    assert out.bullets is not None
    assert len(out.bullets) == 5


def test_orchestrator_keywords() -> None:
    svc = ListingGenerationOrchestratorService(llm=FakeLLM())
    out = svc.generate(
        GenerateListingSectionRequest(strategy=_strategy(), section="keyword_strategy"),
    )
    assert out.backend_search_terms


def test_fake_llm_protocol() -> None:
    assert isinstance(FakeLLM(), ListingLLMClient)


def test_orchestrator_rejects_empty_product_name() -> None:
    svc = ListingGenerationOrchestratorService(llm=FakeLLM())
    bad = _strategy()
    bad = bad.model_copy(update={"nome_prodotto": "  "})
    with pytest.raises(AnalysisPipelineError) as exc:
        svc.generate(GenerateListingSectionRequest(strategy=bad, section="seo_title"))
    assert exc.value.error_code == "STRATEGY_INCOMPLETE"
