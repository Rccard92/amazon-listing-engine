"""Schemi workflow: crea nuova scheda da prodotto simile."""

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl

from app.schemas.product_ai_analysis import ProductStrategyDraft
from app.schemas.work_item import WorkItemRead


FieldClass = Literal["auto_extracted", "ai_suggested", "user_required", "user_confirmation"]


class WorkflowErrorDetail(BaseModel):
    """Dettaglio errore machine-readable per il frontend."""

    error_code: str
    message_it: str
    details: str | None = None


class SimilarField(BaseModel):
    key: str
    label: str
    value: str | list[str] | float | int | None = None
    field_class: FieldClass
    needs_confirmation: bool = False


class CreateFromSimilarRequest(BaseModel):
    competitor_url: HttpUrl = Field(..., description="URL Amazon prodotto simile.")
    work_item_id: UUID | None = Field(default=None, description="Se presente aggiorna la bozza esistente.")
    project_folder_id: UUID | None = None
    user_required: dict = Field(default_factory=dict)
    user_confirmation: dict = Field(default_factory=dict)


class CreateFromSimilarResponse(BaseModel):
    normalized_url: str
    parser_used: str
    warnings: list[str] = Field(default_factory=list)
    extraction_status: str = Field(
        ...,
        description="complete | partial | failed (failed solo se bloccato prima del salvataggio).",
    )
    allow_continue: bool = True
    ai_analysis: ProductStrategyDraft | None = None
    ai_error: WorkflowErrorDetail | None = None
    fields: list[SimilarField] = Field(default_factory=list)
    work_item: WorkItemRead

