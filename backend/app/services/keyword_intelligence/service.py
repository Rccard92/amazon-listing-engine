"""Pipeline applicativa per Product Intelligence + keyword classification."""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.core.keyword_intelligence_rules import get_keyword_intelligence_rules_bundle
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
from app.services.keyword_intelligence.rules_engine import KeywordRulesEngine


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

    def __init__(self) -> None:
        bundle = get_keyword_intelligence_rules_bundle()
        self._rules_version = bundle.rules_version
        self._rules_engine = KeywordRulesEngine(
            rules_version=bundle.rules_version,
            rules_text=bundle.rules_text,
        )

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
                "rules_version": self._rules_version,
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
            rules_applied=self._rules_version,
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
            rules_version=self._rules_version,
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
        product_tokens = {
            token
            for token in _norm(profile.product_detected).split(" ")
            if token and len(token) > 2
        }
        product_tokens.update(
            {
                token
                for token in _norm(profile.category_detected or "").split(" ")
                if token and len(token) > 2
            }
        )
        out: list[KeywordClassificationItem] = []
        for row in rows[:300]:
            kw = _norm(row.keyword)
            if not kw:
                continue
            out.append(
                self._rules_engine.classify_keyword(
                    keyword=kw,
                    primary_set=primary_set,
                    feature_tokens=feature_tokens,
                    product_tokens=product_tokens,
                    row_source="helium10" if ctx.request.helium10_rows else "manual_seed",
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
        return self._rules_engine.build_plan(
            profile=profile,
            classifications=classifications,
            confirmed_by_user=ctx.request.confirm_plan_by_user,
        )
