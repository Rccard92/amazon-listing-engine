"""Schemi Pydantic per cartelle progetto."""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ProjectFolderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    description: str | None = None


class ProjectFolderCreate(ProjectFolderBase):
    pass


class ProjectFolderUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None


class ProjectFolderRead(ProjectFolderBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectFolderSummary(ProjectFolderRead):
    items_count: int = 0
    last_item_updated_at: datetime | None = None

