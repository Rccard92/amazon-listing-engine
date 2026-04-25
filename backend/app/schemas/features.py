"""Contratto capability flags runtime per frontend."""

from pydantic import BaseModel


class FeaturesResponse(BaseModel):
    ai_debug_trace_enabled: bool = False
    keyword_three_layer_enabled: bool = False
    keyword_ai_context_builder_enabled: bool = False
    keyword_deterministic_veto_enabled: bool = True
    keyword_ai_refinement_enabled: bool = False
