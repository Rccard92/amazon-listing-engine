from fastapi.testclient import TestClient

from app.core import config
from app.main import create_app


def test_features_debug_trace_default_off(monkeypatch) -> None:
    monkeypatch.delenv("ENABLE_AI_DEBUG_TRACE", raising=False)
    config.get_settings.cache_clear()
    client = TestClient(create_app())
    response = client.get("/api/v1/features")
    assert response.status_code == 200
    assert response.json()["ai_debug_trace_enabled"] is False


def test_features_debug_trace_on(monkeypatch) -> None:
    monkeypatch.setenv("ENABLE_AI_DEBUG_TRACE", "true")
    config.get_settings.cache_clear()
    client = TestClient(create_app())
    response = client.get("/api/v1/features")
    assert response.status_code == 200
    assert response.json()["ai_debug_trace_enabled"] is True
