"""Brief prodotto manuale (Fase 1) — input strutturato prima dell'arricchimento strategico."""

from pydantic import BaseModel, Field

from app.schemas.confirmed_product_strategy import PriceTier

DEFAULT_BRAND = "Meridiana"


class ProductBrief(BaseModel):
    """Campi raccolti dall'utente; nessun campo obbligatorio lato schema (validazione UX/route)."""

    nome_prodotto: str = ""
    categoria: str | None = None
    brand: str = Field(default=DEFAULT_BRAND, description="Brand commerciale (default Meridiana)")
    descrizione_attuale: str | None = None
    bullet_attuali: list[str] = Field(default_factory=list)
    caratteristiche_specifiche: list[str] = Field(default_factory=list)
    dettagli_articolo: str | None = None
    dettagli_aggiuntivi: str | None = None
    riassunto_ai_recensioni: str | None = None
    keyword_primarie: list[str] = Field(default_factory=list)
    keyword_secondarie: list[str] = Field(default_factory=list)
    livello_prezzo: PriceTier = "unknown"
    linee_guida_brand: str | None = None
    note_utente: str | None = None
