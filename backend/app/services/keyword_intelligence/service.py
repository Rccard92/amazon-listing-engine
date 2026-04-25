"""Pipeline applicativa per Product Intelligence + keyword classification."""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.schemas.keyword_intelligence import (
    ClarificationQuestion,
    ConfirmedKeywordPlan,
    Helium10KeywordRow,
    KeywordClassificationItem,
    KeywordIntelligenceRequest,
    KeywordIntelligenceResponse,
    ProductAttributeSignal,
    ProductIntelligenceProfile,
)
from app.schemas.product_brief import ProductBrief
from app.schemas.strategic_enrichment import StrategicEnrichment
from app.services.debug_trace import DebugTraceCollector


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "").strip().lower())


def _dedupe(values: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for value in values:
        token = _norm(value)
        if not token or token in seen:
            continue
        seen.add(token)
        out.append(token)
    return out


def _compute_profile_confidence(
    *,
    product_name: str,
    category: str | None,
    attributes_count: int,
    uncertain_count: int,
) -> float:
    score = 0.45
    if product_name.strip():
        score += 0.2
    if (category or "").strip():
        score += 0.15
    score += min(attributes_count, 10) * 0.02
    score -= min(uncertain_count, 4) * 0.04
    return max(0.0, min(1.0, round(score, 2)))


@dataclass
class _Context:
    brief: ProductBrief
    enrichment: StrategicEnrichment | None
    request: KeywordIntelligenceRequest


class KeywordIntelligenceService:
    """Costruisce un output keyword-first senza rompere i fallback legacy."""

    def run(
        self,
        *,
        brief: ProductBrief,
        enrichment: StrategicEnrichment | None,
        request: KeywordIntelligenceRequest,
    ) -> KeywordIntelligenceResponse:
        return self.run_with_trace(brief=brief, enrichment=enrichment, request=request, include_debug_trace=False)

    def run_with_trace(
        self,
        *,
        brief: ProductBrief,
        enrichment: StrategicEnrichment | None,
        request: KeywordIntelligenceRequest,
        include_debug_trace: bool = False,
    ) -> KeywordIntelligenceResponse:
        trace = DebugTraceCollector(step="keyword_intelligence", enabled=include_debug_trace)
        ctx = _Context(brief=brief, enrichment=enrichment, request=request)
        profile = self.build_product_intelligence_profile(ctx)
        classifications = self.classify_keywords(ctx, profile)
        clarifications = self.build_clarification_questions(ctx, profile, classifications)
        plan = self.build_keyword_plan(ctx, profile, classifications)
        if include_debug_trace:
            accepted = [c.keyword for c in classifications if c.category in ("PRIMARY_SEO", "SECONDARY_SEO", "FEATURE_KEYWORD")]
            excluded = [c.keyword for c in classifications if c.category in ("NEGATIVE_KEYWORD", "OFF_TARGET")]
            verify = [c.keyword for c in classifications if c.category == "VERIFY_PRODUCT_FEATURE"]
            trace.summary = "Keyword Intelligence completata con classificazione e piano confermabile."
            trace.inputs_used = {
                "uploaded_files": [f.model_dump(mode="json") for f in request.uploaded_files],
                "manual_seed_keywords": request.manual_seed_keywords,
                "helium10_rows_count": len(request.helium10_rows),
            }
            trace.intermediate_outputs = {
                "normalized_columns": ["keyword", "search_volume", "cpr", "source_row"],
                "product_intelligence_profile": profile.model_dump(mode="json"),
            }
            trace.add_decision(label="Keyword accettate", reason=f"Accettate {len(accepted)} keyword coerenti con profilo prodotto.")
            trace.add_decision(label="Keyword escluse", reason=f"Escluse {len(excluded)} keyword off-target/negative.")
            if verify:
                trace.add_decision(
                    label="Keyword da verificare",
                    reason="Presenti termini con possibile ambiguita su compatibilita/caratteristiche.",
                )
            trace.questions_raised = [q.question for q in clarifications]
            trace.confidence_score = profile.confidence_score
            trace.final_output = {
                "keyword_primaria_finale": plan.keyword_primaria_finale,
                "keyword_secondarie_prioritarie": plan.keyword_secondarie_prioritarie[:12],
                "accepted_examples": accepted[:5],
                "excluded_examples": excluded[:5],
                "verify_examples": verify[:5],
            }
            trace.reasoning_summary = (
                "Le keyword sono state classificate usando segnali dal profilo prodotto e regole deterministiche per priorita/esclusioni."
            )
            trace.add_block(title="Input usati", content=f"File: {len(request.uploaded_files)} · Righe: {len(request.helium10_rows)}")
            trace.add_block(title="Decisioni AI", content=f"Accettate: {len(accepted)} · Escluse: {len(excluded)} · Verifica: {len(verify)}")
            trace.add_block(title="Output finale", content=f"Primaria: {plan.keyword_primaria_finale}")
        return KeywordIntelligenceResponse(
            product_intelligence_profile=profile,
            keyword_classifications=classifications,
            clarification_questions=clarifications,
            confirmed_keyword_plan=plan,
            debug_trace=trace.build(),
        )

    def build_product_intelligence_profile(self, ctx: _Context) -> ProductIntelligenceProfile:
        brief = ctx.brief
        enr = ctx.enrichment

        attributes: list[ProductAttributeSignal] = []
        for item in brief.caratteristiche_specifiche[:10]:
            attributes.append(ProductAttributeSignal(name="caratteristica", value=item, confidence=0.8, source="brief"))
        for item in brief.bullet_attuali[:8]:
            attributes.append(ProductAttributeSignal(name="bullet", value=item, confidence=0.6, source="brief"))
        if enr is not None:
            for benefit in enr.benefici_principali[:8]:
                attributes.append(ProductAttributeSignal(name="beneficio", value=benefit, confidence=0.75, source="enrichment"))
            if enr.usp_differenziazione:
                attributes.append(
                    ProductAttributeSignal(
                        name="usp",
                        value=enr.usp_differenziazione,
                        confidence=0.9,
                        source="enrichment",
                    )
                )

        excluded: list[str] = []
        uncertain: list[str] = []
        if not brief.categoria:
            uncertain.append("Categoria non specificata con precisione.")
        if not brief.dettagli_articolo and not brief.dettagli_aggiuntivi:
            uncertain.append("Mancano dettagli articolo/aggiuntivi utili per filtrare keyword non pertinenti.")
        if not brief.riassunto_ai_recensioni:
            excluded.append("Nessun segnale recensioni disponibile in questa bozza.")

        seed_pool = _dedupe(
            [
                *brief.keyword_primarie,
                *brief.keyword_secondarie,
                *ctx.request.manual_seed_keywords,
            ]
        )
        return ProductIntelligenceProfile(
            product_detected=brief.nome_prodotto.strip(),
            category_detected=(brief.categoria or "").strip() or None,
            main_detected_attributes=attributes[:20],
            excluded_attributes=excluded,
            uncertain_attributes=uncertain,
            keyword_seed_pool=seed_pool,
            confidence_score=_compute_profile_confidence(
                product_name=brief.nome_prodotto,
                category=brief.categoria,
                attributes_count=len(attributes),
                uncertain_count=len(uncertain),
            ),
        )

    def classify_keywords(
        self,
        ctx: _Context,
        profile: ProductIntelligenceProfile,
    ) -> list[KeywordClassificationItem]:
        rows = [row for row in ctx.request.helium10_rows if row.keyword.strip()]
        if not rows:
            rows = [Helium10KeywordRow(keyword=x, source_row=i + 1) for i, x in enumerate(profile.keyword_seed_pool)]

        primary_set = set(profile.keyword_seed_pool[:3])
        feature_tokens = {_norm(x.value).split(" ")[0] for x in profile.main_detected_attributes if _norm(x.value)}
        out: list[KeywordClassificationItem] = []
        for row in rows[:300]:
            kw = _norm(row.keyword)
            if not kw:
                continue
            words = kw.split(" ")
            priority = "medium"
            recommended_usage = "bullets_description"
            required_user_confirmation = False
            excluded_reason_type = None
            if kw in primary_set:
                category = "PRIMARY_SEO"
                confidence = 0.92
                priority = "high"
                recommended_usage = "title"
                rationale = "Presente nel seed prioritario."
            elif any(brand_kw in kw for brand_kw in ("nike", "adidas", "apple", "samsung")):
                category = "BRANDED_COMPETITOR"
                confidence = 0.9
                priority = "high"
                recommended_usage = "exclude"
                excluded_reason_type = "competitor_brand"
                rationale = "Termine brand competitor: non va usato nel listing."
            elif any(token and token in kw for token in feature_tokens):
                category = "FEATURE_KEYWORD"
                confidence = 0.8
                priority = "high"
                recommended_usage = "bullets_description"
                rationale = "Allineata ad attributi di prodotto rilevati."
            elif len(words) >= 4:
                category = "LONG_TAIL"
                confidence = 0.74
                priority = "medium"
                recommended_usage = "backend_search_terms"
                rationale = "Query lunga con intento specifico."
            elif "compatib" in kw:
                category = "VERIFY_PRODUCT_FEATURE"
                confidence = 0.65
                priority = "medium"
                recommended_usage = "verify"
                required_user_confirmation = True
                rationale = "Richiede verifica compatibilita/caratteristica."
            elif "gratis" in kw or "download" in kw:
                category = "NEGATIVE_KEYWORD"
                confidence = 0.9
                priority = "high"
                recommended_usage = "exclude"
                excluded_reason_type = "irrelevant_intent"
                rationale = "Intento non coerente con prodotto Amazon."
            elif "ricambio" in kw:
                category = "OFF_TARGET"
                confidence = 0.83
                priority = "high"
                recommended_usage = "exclude"
                excluded_reason_type = "off_target"
                rationale = "Keyword non coerente con il posizionamento del prodotto."
            else:
                category = "SECONDARY_SEO"
                confidence = 0.7
                priority = "medium"
                recommended_usage = "bullets_description"
                rationale = "Keyword pertinente ma non primaria."
            out.append(
                KeywordClassificationItem(
                    keyword=kw,
                    category=category,
                    priority=priority,
                    recommended_usage=recommended_usage,
                    required_user_confirmation=required_user_confirmation,
                    excluded_reason_type=excluded_reason_type,
                    confidence=confidence,
                    rationale=rationale,
                    source="helium10" if ctx.request.helium10_rows else "manual_seed",
                )
            )
        return out

    def build_clarification_questions(
        self,
        ctx: _Context,
        profile: ProductIntelligenceProfile,
        classifications: list[KeywordClassificationItem],
    ) -> list[ClarificationQuestion]:
        questions: list[ClarificationQuestion] = []
        if not profile.category_detected:
            questions.append(
                ClarificationQuestion(
                    id="category_confirm",
                    question="Qual e la categoria Amazon piu specifica del prodotto?",
                    reason="Serve per separare keyword pertinenti da query off-target.",
                    priority="high",
                    answer=ctx.request.clarification_answers.get("category_confirm"),
                )
            )
        to_verify = [c.keyword for c in classifications if c.category == "VERIFY_PRODUCT_FEATURE"][:5]
        if to_verify:
            questions.append(
                ClarificationQuestion(
                    id="feature_verify",
                    question="Confermi che il prodotto supporta queste varianti/compatibilita: " + ", ".join(to_verify) + "?",
                    reason="Alcune keyword implicano compatibilita che potrebbero non essere vere.",
                    priority="medium",
                    answer=ctx.request.clarification_answers.get("feature_verify"),
                )
            )
        return questions

    def build_keyword_plan(
        self,
        ctx: _Context,
        profile: ProductIntelligenceProfile,
        classifications: list[KeywordClassificationItem],
    ) -> ConfirmedKeywordPlan:
        by_category: dict[str, list[str]] = {}
        for item in classifications:
            by_category.setdefault(item.category, []).append(item.keyword)

        primary_candidates = _dedupe(by_category.get("PRIMARY_SEO", []) + profile.keyword_seed_pool)
        secondary = _dedupe(by_category.get("SECONDARY_SEO", []) + by_category.get("LONG_TAIL", []))
        frontend_push = _dedupe(primary_candidates[:1] + secondary[:8] + by_category.get("FEATURE_KEYWORD", [])[:6])
        backend_pool = _dedupe(
            by_category.get("BACKEND_ONLY", [])
            + by_category.get("PPC_EXACT", [])
            + by_category.get("PPC_PHRASE", [])
            + by_category.get("LONG_TAIL", [])[8:]
        )
        notes = [
            "Confermare keyword VERIFY_PRODUCT_FEATURE prima della pubblicazione.",
            "Evitare keyword OFF_TARGET/NEGATIVE in titolo, bullet e backend terms.",
        ]
        definitively_excluded = [
            item
            for item in classifications
            if item.category in ("OFF_TARGET", "NEGATIVE_KEYWORD", "BRANDED_COMPETITOR")
        ]
        return ConfirmedKeywordPlan(
            keyword_primaria_finale=(primary_candidates[0] if primary_candidates else profile.product_detected),
            keyword_secondarie_prioritarie=secondary[:20],
            parole_da_spingere_nel_frontend=frontend_push[:16],
            parole_da_tenere_per_backend=backend_pool[:24],
            keyword_escluse_definitivamente=definitively_excluded[:40],
            note_su_keyword_da_non_forzare=notes,
            classificazioni_confermate=classifications[:150],
            confirmed_by_user=ctx.request.confirm_plan_by_user,
        )
