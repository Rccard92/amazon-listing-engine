"""Arricchimento strategico (Fase 2) — derivato da LLM e/o modificato dall'utente."""

from pydantic import BaseModel, Field


class StrategicEnrichment(BaseModel):
    benefici_principali: list[str] = Field(default_factory=list)
    usp_differenziazione: str | None = None
    target_cliente: str | None = None
    gestione_obiezioni: list[str] = Field(default_factory=list)
    angolo_emotivo: str | None = None
    enrichment_provenance: str | None = Field(
        default=None,
        description="Es. manual, llm_v1",
    )
