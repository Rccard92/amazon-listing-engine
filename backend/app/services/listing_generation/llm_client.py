"""Astrazione provider LLM per generazione testuale (non structured parse)."""

from typing import Protocol, runtime_checkable


@runtime_checkable
class ListingLLMClient(Protocol):
    """Client minimale per completamenti testuali."""

    def generate_text(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        max_output_tokens: int = 2048,
    ) -> str:
        """Restituisce il testo grezzo del modello."""
        ...
