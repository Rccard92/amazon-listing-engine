"""Fixture condivise per test unitari."""

import pytest

from app.core import config


@pytest.fixture
def enable_url_ingestion(monkeypatch: pytest.MonkeyPatch) -> None:
    """Abilita temporaneamente fetch/analisi URL (default MVP: disabilitato)."""
    monkeypatch.setenv("ENABLE_URL_INGESTION", "true")
    config.get_settings.cache_clear()
    yield
    monkeypatch.delenv("ENABLE_URL_INGESTION", raising=False)
    config.get_settings.cache_clear()
