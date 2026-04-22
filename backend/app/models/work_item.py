"""Modello unità di lavoro salvata (Cronologia/Progetti)."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class WorkItem(Base):
    """Elemento di lavoro persistito, con cartella progetto opzionale."""

    __tablename__ = "work_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    workflow_type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft", index=True)
    source_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    competitor_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    input_data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    keyword_data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    generated_output: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    project_folder_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("project_folders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True,
    )

    project_folder = relationship("ProjectFolder", back_populates="work_items")

