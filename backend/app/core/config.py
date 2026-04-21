"""Impostazioni applicative caricate da variabili d'ambiente."""

from functools import lru_cache

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
        default="http://localhost:3000",
        description="Origini CORS separate da virgola",
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

    @computed_field  # type: ignore[prop-decorator]
    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
