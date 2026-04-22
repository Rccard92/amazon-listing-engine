"""Impostazioni applicative caricate da variabili d'ambiente."""

from functools import lru_cache
import json

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurazione centralizzata (MVP, estendibile)."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Amazon Listing Engine API"
    api_v1_prefix: str = "/api/v1"

    database_url: str = Field(
        default="postgresql+psycopg2://postgres:postgres@localhost:5432/amazon_listing",
        description="URL SQLAlchemy per PostgreSQL",
    )

    cors_origins: str = Field(
        default="https://frontend-production-cbba.up.railway.app,http://localhost:3000,http://127.0.0.1:3000",
        description="Origini CORS (CSV o JSON array).",
    )

    amazon_fetch_timeout_seconds: float = Field(
        default=10.0,
        description="Timeout singola richiesta fetch Amazon.",
    )
    amazon_fetch_max_retries: int = Field(
        default=1,
        description="Numero massimo retry fetch Amazon.",
    )
    amazon_fetch_user_agent: str = Field(
        default=(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
        description="User-Agent conservativo per richieste Amazon.",
    )
    amazon_fetch_min_delay_ms: int = Field(
        default=300,
        description="Delay minimo tra richieste (placeholder rate limiting).",
    )
    amazon_enable_cache: bool = Field(
        default=False,
        description="Feature flag per caching by ASIN (placeholder).",
    )
    amazon_rate_limit_per_minute: int = Field(
        default=20,
        description="Limite richieste/minuto (placeholder).",
    )
    enable_url_ingestion: bool = Field(
        default=False,
        description="Se true, espone POST /amazon/analyze e /workflows/create-from-similar (fetch/scrape competitor). "
        "MVP manuale-first: default false.",
    )

    openai_api_key: str = Field(
        default="",
        description="Chiave API OpenAI (solo server, mai esposta al frontend).",
    )
    openai_model: str = Field(
        default="gpt-4o-mini",
        description="Modello OpenAI per analisi strutturata prodotto.",
    )
    openai_timeout_seconds: float = Field(
        default=90.0,
        description="Timeout richieste OpenAI.",
    )
    openai_max_input_chars: int = Field(
        default=48_000,
        description="Limite caratteri del payload testuale inviato al modello.",
    )
    openai_listing_model: str = Field(
        default="",
        description="Modello OpenAI per generazione copy listing; se vuoto usa openai_model.",
    )

    listing_seo_title_max_chars: int = Field(
        default=200,
        description="Limite caratteri titolo SEO (allineare alle policy Amazon per categoria).",
    )
    listing_description_min_chars: int = Field(
        default=200,
        description="Lunghezza minima desiderata descrizione (validazione soft).",
    )
    listing_description_max_chars: int = Field(
        default=2000,
        description="Limite caratteri descrizione (MVP configurabile).",
    )
    listing_backend_search_terms_max_bytes: int = Field(
        default=249,
        description="Limite byte per search terms backend (policy Amazon tipica).",
    )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origins_list(self) -> list[str]:
        raw = (self.cors_origins or "").strip()
        if not raw:
            return []

        parsed: list[str]
        if raw.startswith("["):
            try:
                loaded = json.loads(raw)
                parsed = [str(origin) for origin in loaded] if isinstance(loaded, list) else []
            except json.JSONDecodeError:
                parsed = []
        else:
            parsed = [o.strip() for o in raw.split(",") if o.strip()]

        normalized: list[str] = []
        for origin in parsed:
            value = origin.strip().rstrip("/")
            if value and value not in normalized:
                normalized.append(value)
        return normalized


@lru_cache
def get_settings() -> Settings:
    return Settings()
