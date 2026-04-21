from fastapi.testclient import TestClient

from app.main import app
from app.schemas.amazon_analysis import AmazonAnalyzeResponse, AmazonProductNormalized
from app.services.amazon_analysis_service import AmazonAnalysisService
from app.api.routes import amazon_analysis


def test_post_amazon_analyze_success(monkeypatch) -> None:
    class FakeService(AmazonAnalysisService):
        def analyze(self, *, url: str) -> AmazonAnalyzeResponse:
            return AmazonAnalyzeResponse(
                normalized_url="https://amazon.it/dp/B08N5WRWNW",
                parser_used="hybrid",
                warnings=[],
                product=AmazonProductNormalized(
                    asin="B08N5WRWNW",
                    marketplace="IT",
                    title="Titolo",
                    brand="Brand",
                    bullets=["A", "B"],
                    description="Descrizione",
                    aplus_text="A+",
                    rating=4.5,
                    reviews_count=100,
                    price=19.99,
                    main_image="https://img.example.com/x.jpg",
                ),
            )

    monkeypatch.setattr(amazon_analysis, "service", FakeService())
    client = TestClient(app)
    response = client.post("/api/v1/amazon/analyze", json={"url": "https://amazon.it/dp/B08N5WRWNW"})
    assert response.status_code == 200
    body = response.json()
    assert body["product"]["asin"] == "B08N5WRWNW"
    assert body["product"]["marketplace"] == "IT"

