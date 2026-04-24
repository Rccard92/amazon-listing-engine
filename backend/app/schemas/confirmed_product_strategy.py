"""Strategia prodotto confermata — input dell'orchestrator di generazione listing."""

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.keyword_planning import KeywordPlanning

PriceTier = Literal["entry", "mid", "premium", "unknown"]


class ConfirmedProductStrategy(BaseModel):
    """Dati strutturali confermati dall'utente (o derivati da draft + revisioni)."""

    nome_prodotto: str = Field(default="", description="Nome commerciale / chiave del prodotto (obbligatorio per generare)")
    categoria: str | None = None
    caratteristiche_tecniche: list[str] = Field(default_factory=list)
    benefici_principali: list[str] = Field(default_factory=list)
    usp_differenziazione: str | None = None
    target_cliente: str | None = None
    gestione_obiezioni: list[str] = Field(default_factory=list)
    insight_recensioni_clienti: str | None = Field(
        default=None,
        description="Sintesi insight da recensioni o note qualitative (opzionale).",
    )
    keyword_primarie: list[str] = Field(default_factory=list)
    keyword_secondarie: list[str] = Field(default_factory=list)
    keyword_planning: KeywordPlanning | None = None
    linee_guida_brand: str | None = None
    angolo_emotivo: str | None = None
    livello_prezzo: PriceTier = "unknown"
