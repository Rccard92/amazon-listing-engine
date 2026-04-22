"""Analisi strutturata prodotto tramite OpenAI (isolato dalle route)."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass

from app.core.config import get_settings
from app.schemas.analysis_exceptions import AnalysisPipelineError
from app.schemas.page_ingestion import PageIngestionPayload
from app.schemas.product_ai_analysis import ProductStrategyDraft

logger = logging.getLogger(__name__)


@dataclass
class OpenAIProductAnalysisService:
    """Chiama OpenAI per trasformare il payload di pagina in bozza strategica JSON."""

    def analyze(self, ingestion: PageIngestionPayload) -> ProductStrategyDraft:
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

        client = OpenAI(
            api_key=settings.openai_api_key,
            timeout=settings.openai_timeout_seconds,
        )

        payload_dict = ingestion.model_dump(mode="json")
        digest = str(payload_dict.get("page_text_digest") or "")
        max_chars = settings.openai_max_input_chars
        if len(digest) > max_chars:
            payload_dict["page_text_digest"] = f"{digest[: max_chars - 30].rstrip()}\n...[troncato]"

        user_content = json.dumps(payload_dict, ensure_ascii=False)
        system_prompt = (
            "Sei un analista e-commerce per Amazon. Ricevi dati estratti da UNA sola pagina prodotto "
            "(nessun crawling di massa). "
            "Non inventare specifiche tecniche o certificazioni non presenti nei dati. "
            "Se un'informazione non è deducibile, mettila in missing_information o lascia liste vuote. "
            "Il compito è una BOZZA STRATEGICA strutturata: NON generare titolo Amazon finale né bullet pronti per pubblicazione."
        )

        try:
            parsed = self._invoke_structured(
                client=client,
                model=settings.openai_model,
                system_prompt=system_prompt,
                user_content=user_content,
            )
            return parsed
        except APITimeoutError as exc:
            logger.warning("Timeout OpenAI: %s", exc)
            raise AnalysisPipelineError(
                "OPENAI_REQUEST_FAILED",
                http_status=502,
                details="Timeout OpenAI",
            ) from exc
        except APIError as exc:
            logger.warning("APIError OpenAI: %s", exc)
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

    def _invoke_structured(
        self,
        *,
        client: object,
        model: str,
        system_prompt: str,
        user_content: str,
    ) -> ProductStrategyDraft:
        """Preferisce beta.chat.completions.parse (Pydantic); fallback su json_schema."""
        beta = getattr(client, "beta", None)
        beta_chat = getattr(beta, "chat", None) if beta else None
        beta_completions = getattr(beta_chat, "completions", None) if beta_chat else None
        parse_fn = getattr(beta_completions, "parse", None) if beta_completions else None

        chat = getattr(client, "chat", None)
        completions = getattr(chat, "completions", None) if chat else None

        if callable(parse_fn):
            try:
                completion = parse_fn(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content},
                    ],
                    response_format=ProductStrategyDraft,
                )
                choice0 = completion.choices[0]
                msg = getattr(choice0, "message", None)
                parsed = getattr(msg, "parsed", None) if msg else None
                if isinstance(parsed, ProductStrategyDraft):
                    return parsed
            except Exception as exc:  # noqa: BLE001
                logger.info("Fallback da parse Pydantic: %s", exc)

        schema = ProductStrategyDraft.model_json_schema()
        create_fn = getattr(completions, "create", None) if completions else None
        if not callable(create_fn):
            raise AnalysisPipelineError("OPENAI_REQUEST_FAILED", http_status=502, details="Client OpenAI incompleto")

        completion = create_fn(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "ProductStrategyDraft",
                    "schema": schema,
                    "strict": False,
                },
            },
        )
        raw = completion.choices[0].message.content
        if not raw:
            raise AnalysisPipelineError("AI_OUTPUT_INVALID", http_status=502, details="Risposta vuota")
        try:
            return ProductStrategyDraft.model_validate_json(raw)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Validazione JSON AI fallita: %s", exc)
            raise AnalysisPipelineError(
                "AI_OUTPUT_INVALID",
                http_status=502,
                details=str(exc),
            ) from exc
