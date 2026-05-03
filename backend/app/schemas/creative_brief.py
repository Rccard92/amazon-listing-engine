"""Request/response API Brief Creativo (Fase 5) — output strutturato v2."""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

CreativeBriefArea = Literal["gallery", "a_plus", "faq"]

SCHEMA_VERSION_V2 = "v2"


class CreativeBriefGalleryImage(BaseModel):
    title: str = Field(description="Es. IMAGE 1 — Main image")
    role: str = Field(description="Ruolo sintetico dell'immagine")
    visual_instructions: str = Field(description="Cosa mostrare visivamente")
    short_message: str = Field(description='Messaggio breve in grafica; per main image deve essere "Nessuno"')
    communication_angle: str = Field(description="Angolo di comunicazione")
    designer_instructions: str = Field(description="Indicazioni pratiche per il grafico")
    mistakes_to_avoid: str = Field(description="Errori da evitare")
    product_data_to_highlight: str = Field(description="Dati prodotto da valorizzare")


class CreativeBriefGalleryPayload(BaseModel):
    common_specs: str = Field(
        description="Specifiche comuni galleria (canvas, formato, JPEG; nota main su sfondo bianco e no overlay)"
    )
    images: list[CreativeBriefGalleryImage] = Field(min_length=8, max_length=8)


class CreativeBriefAPlusModule(BaseModel):
    title: str = Field(description="Es. MODULO 1 — Hero image principale")
    dimensions: str = Field(description="Dimensioni desktop/mobile o 4x 300x225")
    visual_objective: str = Field(description="Obiettivo visivo")
    what_to_show: str = Field(description="Cosa deve mostrare il designer")
    suggested_text: str = Field(description="Testo breve suggerito IT max 6-8 parole dove applicabile")
    layout_guidance: str = Field(description="Guida layout")
    elements_to_highlight: str = Field(description="Elementi da evidenziare")
    mistakes_to_avoid: str = Field(description="Errori da evitare")
    product_data_to_use: str = Field(default="", description="Dati prodotto da usare")


class CreativeBriefAPlusPayload(BaseModel):
    modules: list[CreativeBriefAPlusModule] = Field(min_length=3, max_length=3)


class CreativeBriefFaqItem(BaseModel):
    question: str
    answer: str


class CreativeBriefFaqPayload(BaseModel):
    faqs: list[CreativeBriefFaqItem] = Field(min_length=5, max_length=5)


class CreativeBriefGenerateRequest(BaseModel):
    work_item_id: UUID
    area: CreativeBriefArea
    include_raw_model_text: bool = False


class CreativeBriefGenerateResponse(BaseModel):
    area: CreativeBriefArea
    updated_at: str = Field(description="Timestamp ISO consigliato lato client al salvataggio")
    schema_version: str = Field(default=SCHEMA_VERSION_V2)
    gallery: CreativeBriefGalleryPayload | None = None
    a_plus: CreativeBriefAPlusPayload | None = None
    faq: CreativeBriefFaqPayload | None = None
    legacy_body: str | None = Field(
        default=None,
        description="Testo grezzo se il parse JSON fallisce (solo emergenze).",
    )
    parse_warning: str | None = Field(
        default=None,
        description="Avviso non bloccante (es. vincolo soft).",
    )
    raw_model_text: str | None = None
