"""Payload ricco inviato al modello per analisi strutturata."""

from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.amazon_analysis import AmazonProductNormalized


class PageIngestionPayload(BaseModel):
    """Dati estratti dalla singola pagina Amazon + metadati fetch/parse."""

    normalized_url: str
    fetch_http_status: int
    asin: str
    marketplace: str
    parser_used: str
    extraction_status: Literal["complete", "partial", "failed"]
    warnings: list[str] = Field(default_factory=list)
    normalized_product: AmazonProductNormalized
    structured_partial: dict[str, Any] = Field(default_factory=dict)
    dom_partial: dict[str, Any] = Field(default_factory=dict)
    page_text_digest: str = Field(
        default="",
        description="Testo denso ricostruito dalla pagina (troncato lato builder).",
    )
