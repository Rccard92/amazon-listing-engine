"""Output strutturato analisi prodotto (AI) — bozza strategica, non copy finale."""

from typing import Literal

from pydantic import BaseModel, Field


class ProductStrategyDraft(BaseModel):
    """Bozza strategica derivata dall'analisi della pagina e dal modello."""

    normalized_product_name: str = Field(default="", description="Nome prodotto normalizzato")
    category: str | None = None
    technical_features: list[str] = Field(default_factory=list)
    main_benefits: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    probable_usp: str | None = None
    probable_target_customer: str | None = None
    probable_objections: list[str] = Field(default_factory=list)
    evident_keywords: list[str] = Field(default_factory=list)
    inferred_price_tier: Literal["entry", "mid", "premium", "unknown"] = "unknown"
    emotional_angle: str | None = None
    brand_tone_detected: str | None = None
    user_confirmation_fields: list[str] = Field(
        default_factory=list,
        description="Campi che l'utente deve confermare prima della generazione finale.",
    )
    missing_information: list[str] = Field(default_factory=list)
    confidence_notes: list[str] = Field(default_factory=list)
