"""Request/response API Brief Creativo (Fase 5)."""

from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

CreativeBriefArea = Literal["gallery", "a_plus", "faq"]


class CreativeBriefGenerateRequest(BaseModel):
    work_item_id: UUID
    area: CreativeBriefArea
    include_raw_model_text: bool = False


class CreativeBriefGenerateResponse(BaseModel):
    area: CreativeBriefArea
    body: str = Field(description="Testo piano del brief per designer")
    updated_at: str = Field(description="Timestamp ISO consigliato lato client al salvataggio")
    raw_model_text: str | None = None
