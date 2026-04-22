"""Contratti API flusso manuale (arricchimento strategico)."""

from pydantic import BaseModel

from app.schemas.product_brief import ProductBrief


class EnrichStrategicRequest(BaseModel):
    product_brief: ProductBrief


class EnrichStrategicFromWorkItemBody(BaseModel):
    """Opzionale: override brief inline; default carica `product_brief` dal work item."""

    product_brief: ProductBrief | None = None
