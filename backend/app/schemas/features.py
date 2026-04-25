"""Contratto capability flags runtime per frontend."""

from pydantic import BaseModel


class FeaturesResponse(BaseModel):
    ai_debug_trace_enabled: bool = False
