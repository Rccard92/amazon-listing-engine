"""Servizio orchestratore per creare bozza da prodotto simile."""

from dataclasses import dataclass, field
from uuid import UUID

from sqlalchemy.orm import Session

from app.schemas.work_item import WorkItemCreate, WorkItemRead, WorkItemUpdate
from app.schemas.workflow_create_from_similar import (
    CreateFromSimilarRequest,
    CreateFromSimilarResponse,
    SimilarField,
)
from app.services.amazon_analysis_service import AmazonAnalysisService
from app.services.work_item_service import WorkItemService


@dataclass
class WorkflowCreateFromSimilarService:
    analysis_service: AmazonAnalysisService = field(default_factory=AmazonAnalysisService)
    work_item_service: WorkItemService = field(default_factory=WorkItemService)

    def execute(self, db: Session, payload: CreateFromSimilarRequest) -> CreateFromSimilarResponse:
        analyzed = self.analysis_service.analyze(url=str(payload.competitor_url))
        product = analyzed.product

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
            "auto_extracted": auto_extracted,
            "ai_suggested": ai_suggested,
            "user_required": payload.user_required,
            "user_confirmation": payload.user_confirmation,
        }

        summary = f"Bozza da prodotto simile: {product.title or product.asin}"
        title = product.title or "Nuova scheda da prodotto simile"

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
                        generated_output={},
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
                    generated_output={},
                    project_folder_id=payload.project_folder_id,
                ),
            )

        fields = self._build_fields(auto_extracted, ai_suggested, payload)
        return CreateFromSimilarResponse(
            normalized_url=analyzed.normalized_url,
            parser_used=analyzed.parser_used,
            warnings=analyzed.warnings,
            fields=fields,
            work_item=WorkItemRead.model_validate(saved),
        )

    def _build_fields(
        self,
        auto_extracted: dict,
        ai_suggested: dict,
        payload: CreateFromSimilarRequest,
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

