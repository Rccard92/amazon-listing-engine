"""Contratti API flusso manuale (arricchimento strategico)."""

from pydantic import BaseModel

from app.schemas.debug_trace import DebugTrace
from app.schemas.product_brief import ProductBrief
from app.schemas.strategic_enrichment import StrategicEnrichment


class EnrichStrategicRequest(BaseModel):
    product_brief: ProductBrief
    include_debug_trace: bool = False


class EnrichStrategicFromWorkItemBody(BaseModel):
    """Opzionale: override brief inline; default carica `product_brief` dal work item."""

    product_brief: ProductBrief | None = None
    include_debug_trace: bool = False


class EnrichStrategicResponse(BaseModel):
    enrichment: StrategicEnrichment
    debug_trace: DebugTrace | None = None
