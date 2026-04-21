"""Schemi request/response per analisi URL Amazon."""

from pydantic import BaseModel, Field, HttpUrl


class AmazonAnalyzeRequest(BaseModel):
    """Richiesta analisi: un solo URL Amazon per volta."""

    url: HttpUrl = Field(..., description="URL prodotto Amazon da analizzare")


class AmazonProductNormalized(BaseModel):
    """Output normalizzato pronto per scoring/listing improvement."""

    asin: str
    marketplace: str
    title: str | None = None
    brand: str | None = None
    bullets: list[str] = Field(default_factory=list)
    description: str | None = None
    aplus_text: str | None = None
    rating: float | None = None
    reviews_count: int | None = None
    price: float | None = None
    main_image: str | None = None


class AmazonAnalyzeResponse(BaseModel):
    """Risposta endpoint analisi."""

    normalized_url: str
    parser_used: str = Field(
        ...,
        description="Indica quali parser hanno contribuito (structured/dom/hybrid).",
    )
    warnings: list[str] = Field(default_factory=list)
    product: AmazonProductNormalized
