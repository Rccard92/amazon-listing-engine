"""Implementazione OpenAI per ListingLLMClient."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from app.core.config import get_settings
from app.schemas.analysis_exceptions import AnalysisPipelineError

logger = logging.getLogger(__name__)


@dataclass
class OpenAIListingLLMClient:
    """Chat completion testuale; errori mappati su AnalysisPipelineError."""

    def generate_text(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        max_output_tokens: int = 2048,
    ) -> str:
        settings = get_settings()
        if not (settings.openai_api_key or "").strip():
            raise AnalysisPipelineError(
                "OPENAI_NOT_CONFIGURED",
                http_status=503,
                details="OPENAI_API_KEY mancante",
            )
        try:
            from openai import APIError, APITimeoutError, OpenAI
        except ImportError as exc:  # pragma: no cover
            raise AnalysisPipelineError(
                "OPENAI_REQUEST_FAILED",
                http_status=502,
                details="Pacchetto openai non installato",
            ) from exc

        model = (settings.openai_listing_model or settings.openai_model or "").strip() or settings.openai_model
        client = OpenAI(api_key=settings.openai_api_key, timeout=settings.openai_timeout_seconds)

        try:
            chat = client.chat
            completions = chat.completions
            completion = completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                max_completion_tokens=max_output_tokens,
            )
        except APITimeoutError as exc:
            logger.warning("Timeout OpenAI listing: %s", exc)
            raise AnalysisPipelineError(
                "OPENAI_REQUEST_FAILED",
                http_status=502,
                details="Timeout OpenAI",
            ) from exc
        except APIError as exc:
            logger.warning("APIError OpenAI listing: %s", exc)
            status = getattr(exc, "status_code", None)
            if status == 429:
                raise AnalysisPipelineError(
                    "OPENAI_RATE_LIMIT",
                    http_status=429,
                    details=str(exc),
                ) from exc
            raise AnalysisPipelineError(
                "OPENAI_REQUEST_FAILED",
                http_status=502,
                details=str(exc),
            ) from exc

        raw = completion.choices[0].message.content
        if not raw:
            raise AnalysisPipelineError("AI_OUTPUT_INVALID", http_status=502, details="Risposta vuota")
        return raw.strip()
