"""Contratti Pydantic v2 per health check."""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Risposta health check applicativo."""

    status: str = Field(..., examples=["ok"])
    service: str = Field(..., examples=["amazon-listing-engine-api"])


class HealthDetailedResponse(HealthResponse):
    """Health con verifica database."""

    database: str = Field(..., examples=["connected", "error"])
