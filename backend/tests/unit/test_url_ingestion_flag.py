"""Endpoint URL ingestion assenti quando disabilitati (MVP manuale-first)."""

from fastapi.testclient import TestClient

from app.core import config
from app.main import create_app


def test_amazon_analyze_not_registered_when_url_ingestion_disabled(monkeypatch) -> None:
    monkeypatch.delenv("ENABLE_URL_INGESTION", raising=False)
    config.get_settings.cache_clear()
    client = TestClient(create_app())
    response = client.post("/api/v1/amazon/analyze", json={"url": "https://www.amazon.it/dp/B08N5WRWNW"})
    assert response.status_code == 404


def test_create_from_similar_not_registered_when_url_ingestion_disabled(monkeypatch) -> None:
    monkeypatch.delenv("ENABLE_URL_INGESTION", raising=False)
    config.get_settings.cache_clear()
    client = TestClient(create_app())
    response = client.post(
        "/api/v1/workflows/create-from-similar",
        json={"competitor_url": "https://www.amazon.it/dp/B08N5WRWNW"},
    )
    assert response.status_code == 404
