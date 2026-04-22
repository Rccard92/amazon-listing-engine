"""Schemi Pydantic per work item Cronologia/Progetti."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class WorkItemBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=180)
    workflow_type: str = Field(..., examples=["new_listing", "improve_listing", "competitor_analysis"])
    status: str = Field(default="draft", examples=["draft", "in_progress", "completed"])
    source_url: str | None = None
    competitor_url: str | None = None
    summary: str | None = None
    input_data: dict = Field(default_factory=dict)
    keyword_data: dict = Field(default_factory=dict)
    generated_output: dict = Field(default_factory=dict)
    project_folder_id: UUID | None = None


class WorkItemCreate(WorkItemBase):
    pass


class WorkItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    workflow_type: str | None = None
    status: str | None = None
    source_url: str | None = None
    competitor_url: str | None = None
    summary: str | None = None
    input_data: dict | None = None
    keyword_data: dict | None = None
    generated_output: dict | None = None
    project_folder_id: UUID | None = None


class WorkItemRead(WorkItemBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

