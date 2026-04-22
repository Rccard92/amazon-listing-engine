"""Servizio orchestratore per creare bozza da prodotto simile."""

from __future__ import annotations

import re
from dataclasses import dataclass, field

from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.schemas.analysis_exceptions import (
    AnalysisPipelineError,
    map_amazon_url_error,
    map_fetch_error,
)
from app.schemas.product_ai_analysis import ProductStrategyDraft
from app.schemas.work_item import WorkItemCreate, WorkItemRead, WorkItemUpdate
from app.schemas.workflow_create_from_similar import (
    CreateFromSimilarRequest,
    CreateFromSimilarResponse,
    SimilarField,
    WorkflowErrorDetail,
)
from app.services.amazon_analysis_service import AmazonAnalysisService
from app.services.amazon_fetcher import (
    AmazonFetchChallengeError,
    AmazonFetchError,
    AmazonFetchHttpError,
    AmazonFetchTimeoutError,
)
from app.services.amazon_url_service import AmazonUrlError
from app.services.openai_product_analysis_service import OpenAIProductAnalysisService
from app.services.page_ingestion_service import build_page_ingestion_payload
from app.services.work_item_service import WorkItemService

WORK_ITEM_TITLE_MAX_LEN = 180
WORK_ITEM_SUMMARY_MAX_LEN = 240


class WorkflowCreateFromSimilarError(Exception):
    """Errore applicativo nel workflow create-from-similar."""


@dataclass
class WorkflowCreateFromSimilarService:
    analysis_service: AmazonAnalysisService = field(default_factory=AmazonAnalysisService)
    work_item_service: WorkItemService = field(default_factory=WorkItemService)
    openai_service: OpenAIProductAnalysisService = field(default_factory=OpenAIProductAnalysisService)

    def execute(self, db: Session, payload: CreateFromSimilarRequest) -> CreateFromSimilarResponse:
        try:
            full = self.analysis_service.analyze_full(url=str(payload.competitor_url))
        except AmazonUrlError as exc:
            raise map_amazon_url_error(exc) from exc
        except (
            AmazonFetchTimeoutError,
            AmazonFetchHttpError,
            AmazonFetchChallengeError,
            AmazonFetchError,
        ) as exc:
            raise map_fetch_error(exc) from exc
        except Exception as exc:  # noqa: BLE001
            raise AnalysisPipelineError(
                "PARSER_ERROR",
                http_status=502,
                details=str(exc),
            ) from exc

        analyzed = full.response
        product = analyzed.product

        ingestion = build_page_ingestion_payload(
            analyzed=analyzed,
            fetched=full.fetched,
            structured=full.structured,
            dom=full.dom,
        )

        if ingestion.extraction_status == "failed":
            raise AnalysisPipelineError(
                "EXTRACTION_EMPTY",
                http_status=422,
                message_it="Pagina caricata ma non abbiamo estratto dati prodotto utili.",
                details="extraction_status=failed",
            )

        auto_extracted = {
            "asin": product.asin,
            "marketplace": product.marketplace,
            "title": product.title,
            "brand": product.brand,
            "bullets": product.bullets,
            "description": product.description,
            "price": product.price,
            "rating": product.rating,
            "reviews_count": product.reviews_count,
        }

        ai_analysis: ProductStrategyDraft | None = None
        ai_error: WorkflowErrorDetail | None = None
        try:
            ai_analysis = self.openai_service.analyze(ingestion)
        except AnalysisPipelineError as exc:
            if exc.error_code in (
                "OPENAI_NOT_CONFIGURED",
                "OPENAI_REQUEST_FAILED",
                "OPENAI_RATE_LIMIT",
                "AI_OUTPUT_INVALID",
            ):
                ai_error = WorkflowErrorDetail(
                    error_code=exc.error_code,
                    message_it=exc.message_it,
                    details=exc.details,
                )
            else:
                raise

        if ai_analysis is not None:
            ai_suggested = self._ai_suggested_from_draft(ai_analysis)
        else:
            ai_suggested = {
                "likely_target_audience": self._guess_target_audience(product),
                "positioning_clues": self._guess_positioning_clues(product),
                "pricing_tier_clues": self._guess_pricing_tier(product.price),
                "messaging_angle_suggestions": self._guess_messaging_angles(product),
                "likely_objections": self._guess_objections(product),
            }

        input_data = {
            "source_analysis": {
                "normalized_url": analyzed.normalized_url,
                "parser_used": analyzed.parser_used,
                "warnings": analyzed.warnings,
                "product": product.model_dump(),
            },
            "page_ingestion": ingestion.model_dump(mode="json"),
            "auto_extracted": auto_extracted,
            "ai_suggested": ai_suggested,
            "ai_strategy_draft": ai_analysis.model_dump() if ai_analysis else None,
            "user_required": payload.user_required,
            "user_confirmation": payload.user_confirmation,
        }

        generated_output: dict = {}
        if ai_analysis is not None:
            generated_output["product_strategy_draft"] = ai_analysis.model_dump()
        if ai_error is not None:
            generated_output["ai_error"] = ai_error.model_dump()

        title = self._build_internal_work_item_title(product.title, product.asin)
        summary = self._build_internal_work_item_summary(title, product.asin)

        try:
            if payload.work_item_id:
                saved = self.work_item_service.update_item(
                    db,
                    payload.work_item_id,
                    WorkItemUpdate(
                        title=title,
                        workflow_type="competitor_analysis",
                        status="in_progress",
                        competitor_url=str(payload.competitor_url),
                        summary=summary,
                        input_data=input_data,
                        generated_output=generated_output or None,
                    ),
                )
                if saved is None:
                    saved = self.work_item_service.create_item(
                        db,
                        WorkItemCreate(
                            title=title,
                            workflow_type="competitor_analysis",
                            status="in_progress",
                            competitor_url=str(payload.competitor_url),
                            summary=summary,
                            input_data=input_data,
                            keyword_data={},
                            generated_output=generated_output,
                            project_folder_id=payload.project_folder_id,
                        ),
                    )
            else:
                saved = self.work_item_service.create_item(
                    db,
                    WorkItemCreate(
                        title=title,
                        workflow_type="competitor_analysis",
                        status="in_progress",
                        competitor_url=str(payload.competitor_url),
                        summary=summary,
                        input_data=input_data,
                        keyword_data={},
                        generated_output=generated_output,
                        project_folder_id=payload.project_folder_id,
                    ),
                )
        except ValidationError as exc:
            raise WorkflowCreateFromSimilarError("Dati bozza non validi durante il salvataggio.") from exc

        fields = self._build_fields(auto_extracted, ai_suggested, payload, ai_analysis)
        allow_continue = ingestion.extraction_status in ("complete", "partial")

        return CreateFromSimilarResponse(
            normalized_url=analyzed.normalized_url,
            parser_used=analyzed.parser_used,
            warnings=ingestion.warnings,
            extraction_status=ingestion.extraction_status,
            allow_continue=allow_continue,
            ai_analysis=ai_analysis,
            ai_error=ai_error,
            fields=fields,
            work_item=WorkItemRead.model_validate(saved),
        )

    def _ai_suggested_from_draft(self, draft: ProductStrategyDraft) -> dict:
        angles: list[str] = []
        if draft.emotional_angle:
            angles.append(draft.emotional_angle)
        if draft.brand_tone_detected:
            angles.append(f"Tono rilevato: {draft.brand_tone_detected}")
        return {
            "likely_target_audience": draft.probable_target_customer or draft.normalized_product_name,
            "positioning_clues": (draft.strengths or [])[:8] + (draft.confidence_notes or [])[:3],
            "pricing_tier_clues": draft.inferred_price_tier,
            "messaging_angle_suggestions": angles or ["Angolo da definire con il brand"],
            "likely_objections": draft.probable_objections,
        }

    def _build_fields(
        self,
        auto_extracted: dict,
        ai_suggested: dict,
        payload: CreateFromSimilarRequest,
        strategy: ProductStrategyDraft | None,
    ) -> list[SimilarField]:
        fields: list[SimilarField] = []
        for key, value in auto_extracted.items():
            fields.append(
                SimilarField(
                    key=key,
                    label=key.replace("_", " ").capitalize(),
                    value=value,
                    field_class="auto_extracted",
                    needs_confirmation=key in {"title", "brand", "bullets", "description", "price"},
                )
            )
        for key, value in ai_suggested.items():
            fields.append(
                SimilarField(
                    key=key,
                    label=key.replace("_", " ").capitalize(),
                    value=value,
                    field_class="ai_suggested",
                    needs_confirmation=True,
                )
            )
        if strategy is not None:
            fields.extend(self._strategy_similar_fields(strategy))
        for key, value in payload.user_required.items():
            fields.append(
                SimilarField(
                    key=key,
                    label=key.replace("_", " ").capitalize(),
                    value=value,
                    field_class="user_required",
                )
            )
        for key, value in payload.user_confirmation.items():
            fields.append(
                SimilarField(
                    key=key,
                    label=key.replace("_", " ").capitalize(),
                    value=value,
                    field_class="user_confirmation",
                    needs_confirmation=True,
                )
            )
        return fields

    def _strategy_similar_fields(self, draft: ProductStrategyDraft) -> list[SimilarField]:
        pairs = [
            ("strategy_normalized_name", "Nome normalizzato (AI)", draft.normalized_product_name),
            ("strategy_category", "Categoria (AI)", draft.category),
            ("strategy_technical_features", "Caratteristiche tecniche (AI)", draft.technical_features),
            ("strategy_main_benefits", "Benefici principali (AI)", draft.main_benefits),
            ("strategy_usp", "USP probabile (AI)", draft.probable_usp),
            ("strategy_keywords", "Keyword evidenti (AI)", draft.evident_keywords),
            ("strategy_missing", "Informazioni mancanti (AI)", draft.missing_information),
            ("strategy_confirm", "Campi da confermare (AI)", draft.user_confirmation_fields),
        ]
        out: list[SimilarField] = []
        for key, label, value in pairs:
            out.append(
                SimilarField(
                    key=key,
                    label=label,
                    value=value,
                    field_class="ai_suggested",
                    needs_confirmation=True,
                )
            )
        return out

    def _guess_target_audience(self, product) -> str:
        title = (product.title or "").lower()
        if "profession" in title or "ufficio" in title:
            return "Professionisti e utenti da ufficio"
        if "casa" in title:
            return "Uso domestico quotidiano"
        return "Utenti che cercano una soluzione pratica e affidabile"

    def _guess_positioning_clues(self, product) -> list[str]:
        clues: list[str] = []
        if product.rating and product.rating >= 4.5:
            clues.append("Percezione premium grazie a rating elevato")
        if product.reviews_count and product.reviews_count > 500:
            clues.append("Forte prova sociale (alto volume recensioni)")
        if product.brand:
            clues.append(f"Brand riconoscibile: {product.brand}")
        return clues or ["Posizionamento da validare con i punti di forza del tuo brand"]

    def _guess_pricing_tier(self, price: float | None) -> str:
        if price is None:
            return "Non determinato"
        if price < 20:
            return "entry"
        if price < 50:
            return "mid"
        return "premium"

    def _guess_messaging_angles(self, product) -> list[str]:
        angles: list[str] = []
        if product.bullets:
            angles.append("Valorizza benefici concreti in stile bullet-oriented")
        if product.description:
            angles.append("Rafforza fiducia con tono chiaro e orientato all'uso reale")
        angles.append("Evidenzia differenze reali rispetto al prodotto simile")
        return angles

    def _guess_objections(self, product) -> list[str]:
        objections: list[str] = ["Compatibilita' reale con il caso d'uso", "Rapporto qualita'/prezzo"]
        if not product.reviews_count:
            objections.append("Affidabilita' percepita in assenza di molte recensioni")
        return objections

    def _build_internal_work_item_title(self, raw_title: str | None, asin: str | None) -> str:
        normalized = self._normalize_whitespace(raw_title)
        stripped = self._strip_marketplace_suffixes(normalized)
        clean = self._normalize_whitespace(stripped)
        if not clean:
            return self._fallback_title(asin)
        return self._truncate_for_work_item_title(clean)

    def _build_internal_work_item_summary(self, title: str, asin: str | None) -> str:
        base = f"Bozza da prodotto simile: {title or (asin or 'prodotto')}"
        return self._truncate(base, WORK_ITEM_SUMMARY_MAX_LEN)

    def _normalize_whitespace(self, value: str | None) -> str:
        if not isinstance(value, str):
            return ""
        return re.sub(r"\s+", " ", value).strip()

    def _strip_marketplace_suffixes(self, value: str) -> str:
        if not value:
            return value
        cleaned = value
        for sep in (" | ", " - ", " • "):
            if sep not in cleaned:
                continue
            head, tail = cleaned.rsplit(sep, 1)
            if self._looks_like_noise_suffix(tail):
                cleaned = head
        cleaned = re.sub(r"(?:\||-|•)\s*Amazon\.[A-Za-z.]+\s*$", "", cleaned, flags=re.IGNORECASE)
        return cleaned.strip(" -|•")

    def _looks_like_noise_suffix(self, segment: str) -> bool:
        text = segment.strip().lower()
        return any(
            token in text
            for token in ("amazon.", "categoria", "electronics", "kitchen", "casa", "shop")
        )

    def _truncate_for_work_item_title(self, value: str, max_len: int = WORK_ITEM_TITLE_MAX_LEN) -> str:
        return self._truncate(value, max_len)

    def _truncate(self, value: str, max_len: int) -> str:
        if len(value) <= max_len:
            return value
        return f"{value[: max_len - 3].rstrip()}..."

    def _fallback_title(self, asin: str | None) -> str:
        if asin:
            return f"Bozza da prodotto simile ({asin})"
        return "Bozza da prodotto simile"
