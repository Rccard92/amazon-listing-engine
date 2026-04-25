"""Caricamento regole Keyword Intelligence separato da DOGMA."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from app.core.config import get_settings

DEFAULT_RULES_VERSION = "keyword_intelligence_rules_v1"


@dataclass(frozen=True)
class KeywordIntelligenceRulesBundle:
    """Regole keyword intelligence caricate da file markdown dedicato."""

    rules_text: str
    rules_version: str
    source_path: str


def _backend_root() -> Path:
    here = Path(__file__).resolve()
    return here.parents[2]


def _default_rules_path() -> Path:
    return _backend_root() / "keyword_intelligence" / "KEYWORD_INTELLIGENCE_RULES.md"


def _extract_rules_version(text: str) -> str:
    for line in text.splitlines():
        token = line.strip().lower()
        if token.startswith("- rules_version:"):
            value = line.split(":", 1)[1].strip()
            if value:
                return f"keyword_intelligence_rules_{value}"
    return DEFAULT_RULES_VERSION


def _resolve_rules_path(raw_path: str | None = None) -> Path:
    configured = (raw_path or "").strip() or get_settings().keyword_intelligence_rules_path.strip()
    default_path = _default_rules_path().resolve()
    if not configured:
        if default_path.is_file():
            return default_path
        raise FileNotFoundError(f"File regole keyword intelligence mancante: {default_path}")
    candidate = Path(configured)
    if not candidate.is_absolute():
        candidate = (_backend_root() / candidate).resolve()
    if candidate.is_file():
        return candidate
    raise FileNotFoundError(f"Path regole keyword intelligence non valido: {candidate}")


def load_keyword_intelligence_rules(path: Path | None = None) -> KeywordIntelligenceRulesBundle:
    target = path.resolve() if path else _resolve_rules_path()
    text = target.read_text(encoding="utf-8")
    return KeywordIntelligenceRulesBundle(
        rules_text=text,
        rules_version=_extract_rules_version(text),
        source_path=str(target),
    )


@lru_cache
def _cached_bundle(path_str: str) -> KeywordIntelligenceRulesBundle:
    return load_keyword_intelligence_rules(Path(path_str))


def get_keyword_intelligence_rules_bundle(path: Path | None = None) -> KeywordIntelligenceRulesBundle:
    target = path.resolve() if path else _resolve_rules_path()
    return _cached_bundle(str(target))


def invalidate_keyword_intelligence_rules_cache() -> None:
    _cached_bundle.cache_clear()
