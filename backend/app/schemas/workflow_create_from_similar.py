"""Schemi workflow: crea nuova scheda da prodotto simile."""

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl

from app.schemas.work_item import WorkItemRead


FieldClass = Literal["auto_extracted", "ai_suggested", "user_required", "user_confirmation"]


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
    fields: list[SimilarField] = Field(default_factory=list)
    work_item: WorkItemRead

