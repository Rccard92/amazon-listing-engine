"""Layer 2: veto/screening deterministico keyword."""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.schemas.keyword_intelligence import (
    ExcludedReasonType,
    KeywordClassificationItem,
    ProductKeywordContext,
)


def _norm(text: str) -> str:
    return re.sub(r"\s+", " ", str(text or "").strip().lower())


@dataclass(frozen=True)
class VetoDecision:
    decision: str
    reason_type: ExcludedReasonType | None
    rationale: str
    normalized_keyword: str
    competitor_brand_match: bool
    forbidden_concept_match: bool
    uncertain_attribute_match: bool


@dataclass
class KeywordDeterministicVetoEngine:
    """Blocca keyword incoerenti prima del refinement."""
    last_keyword_decisions: list[dict[str, str | bool | None]] | None = None

    def evaluate(self, *, keyword: str, context: ProductKeywordContext) -> VetoDecision:
        kw = _norm(keyword)
        if not kw:
            return VetoDecision(
                decision="exclude",
                reason_type="off_target",
                rationale="Keyword vuota/non valida.",
                normalized_keyword=kw,
                competitor_brand_match=False,
                forbidden_concept_match=False,
                uncertain_attribute_match=False,
            )

        competitor_brands = {_norm(x) for x in context.possible_competitor_brands if _norm(x)}
        fallback_competitors = {"nike", "adidas", "apple", "samsung", "dyson", "philips"}
        competitor_match = any(brand and brand in kw for brand in (competitor_brands | fallback_competitors))
        if competitor_match:
            return VetoDecision(
                decision="exclude",
                reason_type="competitor_brand",
                rationale="Brand competitor rilevato: keyword bloccata.",
                normalized_keyword=kw,
                competitor_brand_match=True,
                forbidden_concept_match=False,
                uncertain_attribute_match=False,
            )

        forbidden = {_norm(x) for x in context.forbidden_keyword_concepts if _norm(x)}
        forbidden.update({"gratis", "download", "free", "ricambio", "usato"})
        forbidden_match = any(token and token in kw for token in forbidden)
        if forbidden_match:
            reason = "forbidden_concept" if any(token in kw for token in {_norm(x) for x in context.forbidden_keyword_concepts}) else "wrong_product_type"
            return VetoDecision(
                decision="exclude",
                reason_type=reason,  # type: ignore[arg-type]
                rationale="Concetto vietato o prodotto non coerente.",
                normalized_keyword=kw,
                competitor_brand_match=False,
                forbidden_concept_match=True,
                uncertain_attribute_match=False,
            )

        uncertain_values = {_norm(x.value) for x in context.uncertain_attributes if _norm(x.value)}
        uncertain_match = "compatib" in kw or "compatibile" in kw or any(val and val in kw for val in uncertain_values)
        if uncertain_match:
            return VetoDecision(
                decision="verify",
                reason_type="unsupported_feature",
                rationale="Dipende da attributo non confermato: inviata in verifica.",
                normalized_keyword=kw,
                competitor_brand_match=False,
                forbidden_concept_match=False,
                uncertain_attribute_match=True,
            )

        allowed = {_norm(x) for x in context.allowed_keyword_concepts if _norm(x)}
        if allowed and not any(token in kw for token in allowed):
            return VetoDecision(
                decision="exclude",
                reason_type="off_target",
                rationale="Keyword fuori perimetro rispetto ai concetti consentiti.",
                normalized_keyword=kw,
                competitor_brand_match=False,
                forbidden_concept_match=False,
                uncertain_attribute_match=False,
            )

        if len(kw.split(" ")) <= 1 and kw in {"top", "migliore", "universale"}:
            return VetoDecision(
                decision="exclude",
                reason_type="too_ambiguous",
                rationale="Keyword troppo ambigua per posizionamento affidabile.",
                normalized_keyword=kw,
                competitor_brand_match=False,
                forbidden_concept_match=False,
                uncertain_attribute_match=False,
            )

        return VetoDecision(
            decision="allow",
            reason_type=None,
            rationale="Keyword coerente con contesto prodotto.",
            normalized_keyword=kw,
            competitor_brand_match=False,
            forbidden_concept_match=False,
            uncertain_attribute_match=False,
        )

    def apply(
        self,
        *,
        items: list[KeywordClassificationItem],
        context: ProductKeywordContext,
    ) -> tuple[list[KeywordClassificationItem], dict[str, int]]:
        out: list[KeywordClassificationItem] = []
        summary = {"allowed": 0, "verify": 0, "excluded": 0}
        decisions: list[dict[str, str | bool | None]] = []
        for item in items:
            pre_category = item.category
            decision = self.evaluate(keyword=item.keyword, context=context)
            if decision.decision == "exclude":
                item.category = "OFF_TARGET"
                item.recommended_usage = "exclude"
                item.excluded_reason_type = decision.reason_type
                item.rationale = decision.rationale
                summary["excluded"] += 1
            elif decision.decision == "verify":
                item.category = "VERIFY_PRODUCT_FEATURE"
                item.recommended_usage = "verify"
                item.required_user_confirmation = True
                item.excluded_reason_type = decision.reason_type
                item.rationale = decision.rationale
                summary["verify"] += 1
            else:
                summary["allowed"] += 1
            decisions.append(
                {
                    "keyword": item.keyword,
                    "normalized_keyword": decision.normalized_keyword,
                    "pre_category": pre_category,
                    "post_category": item.category,
                    "decision": decision.decision,
                    "reason_type": decision.reason_type,
                    "reason": decision.rationale,
                    "competitor_brand_match": decision.competitor_brand_match,
                    "forbidden_concept_match": decision.forbidden_concept_match,
                    "uncertain_attribute_match": decision.uncertain_attribute_match,
                    "passed_to_refinement": decision.decision == "allow",
                }
            )
            out.append(item)
        self.last_keyword_decisions = decisions
        return out, summary
