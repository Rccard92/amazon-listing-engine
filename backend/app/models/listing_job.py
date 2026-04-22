"""Modello placeholder per job di listing (MVP schema iniziale)."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base


class ListingJob(Base):
    """
    Traccia minimale di un job di ottimizzazione listing.

    Estendibile in seguito con stati, payload JSON, errori, ecc.

    Nota cleanup MVP (2026): la tabella `listing_jobs` è creata da Alembic ma **nessun route o
    servizio** nel codebase attivo la usa ancora. Conviene tenerla (vuota) finché non si decide
    una migration di drop esplicita su tutti gli ambienti, per evitare drift schema.
    """

    __tablename__ = "listing_jobs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    job_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    source_hint: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
