import pytest

from app.core import config
from app.schemas.analysis_exceptions import AnalysisPipelineError
from app.schemas.amazon_analysis import AmazonProductNormalized
from app.schemas.page_ingestion import PageIngestionPayload
from app.services.openai_product_analysis_service import OpenAIProductAnalysisService


def _minimal_ingestion() -> PageIngestionPayload:
    return PageIngestionPayload(
        normalized_url="https://www.amazon.it/dp/B08N5WRWNW",
        fetch_http_status=200,
        asin="B08N5WRWNW",
        marketplace="it",
        parser_used="unit",
        extraction_status="complete",
        normalized_product=AmazonProductNormalized(
            asin="B08N5WRWNW",
            marketplace="it",
            title="Prodotto test",
        ),
    )


def test_analyze_raises_openai_not_configured_without_api_key(monkeypatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    config.get_settings.cache_clear()
    try:
        with pytest.raises(AnalysisPipelineError) as exc_info:
            OpenAIProductAnalysisService().analyze(_minimal_ingestion())
        assert exc_info.value.error_code == "OPENAI_NOT_CONFIGURED"
    finally:
        config.get_settings.cache_clear()
