from fastapi.testclient import TestClient

from app.core import config
from app.main import create_app


def test_features_debug_trace_default_off(monkeypatch) -> None:
    monkeypatch.delenv("ENABLE_AI_DEBUG_TRACE", raising=False)
    monkeypatch.delenv("ENABLE_KEYWORD_THREE_LAYER", raising=False)
    config.get_settings.cache_clear()
    client = TestClient(create_app())
    response = client.get("/api/v1/features")
    assert response.status_code == 200
    assert response.json()["ai_debug_trace_enabled"] is False
    assert response.json()["keyword_three_layer_enabled"] is False
    assert response.json()["keyword_deterministic_veto_enabled"] is True
    assert response.json()["keyword_forensic_debug_enabled"] is False


def test_features_debug_trace_on(monkeypatch) -> None:
    monkeypatch.setenv("ENABLE_AI_DEBUG_TRACE", "true")
    monkeypatch.setenv("ENABLE_KEYWORD_THREE_LAYER", "true")
    monkeypatch.setenv("ENABLE_KEYWORD_AI_CONTEXT_BUILDER", "true")
    monkeypatch.setenv("ENABLE_KEYWORD_AI_REFINEMENT", "true")
    monkeypatch.setenv("KEYWORD_FORENSIC_DEBUG_ENABLED", "true")
    config.get_settings.cache_clear()
    client = TestClient(create_app())
    response = client.get("/api/v1/features")
    assert response.status_code == 200
    assert response.json()["ai_debug_trace_enabled"] is True
    assert response.json()["keyword_three_layer_enabled"] is True
    assert response.json()["keyword_ai_context_builder_enabled"] is True
    assert response.json()["keyword_ai_refinement_enabled"] is True
    assert response.json()["keyword_forensic_debug_enabled"] is True
