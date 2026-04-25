"""Motore regole deterministiche per Keyword Intelligence."""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.schemas.keyword_intelligence import (
    ConfirmedKeywordPlan,
    KeywordClassificationItem,
    ProductIntelligenceProfile,
)


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


@dataclass(frozen=True)
class KeywordRulesEngine:
    """Applica le regole keyword per classificazione e piano finale."""

    rules_version: str
    rules_text: str

    def classify_keyword(
        self,
        *,
        keyword: str,
        primary_set: set[str],
        feature_tokens: set[str],
        product_tokens: set[str],
        row_source: str,
    ) -> KeywordClassificationItem:
        kw = _norm(keyword)
        words = kw.split(" ")
        priority = "medium"
        recommended_usage = "bullets_description"
        required_user_confirmation = False
        excluded_reason_type = None

        competitor_tokens = ("nike", "adidas", "apple", "samsung", "philips", "dyson")
        digital_intent = ("gratis", "download", "free", "pdf")
        wrong_product_tokens = ("ricambio", "pezzo di ricambio", "usato", "batteria auto", "benzina", "diesel")
        ambiguous_tokens = ("migliore", "top", "universale")

        if any(token in kw for token in competitor_tokens):
            category = "BRANDED_COMPETITOR"
            confidence = 0.92
            priority = "high"
            recommended_usage = "exclude"
            excluded_reason_type = "competitor_brand"
            rationale = "Contiene brand competitor: esclusa da frontend e backend."
        elif any(token in kw for token in digital_intent):
            category = "NEGATIVE_KEYWORD"
            confidence = 0.9
            priority = "high"
            recommended_usage = "exclude"
            excluded_reason_type = "irrelevant_intent"
            rationale = "Intento non coerente con listing prodotto fisico."
        elif any(token in kw for token in wrong_product_tokens):
            category = "OFF_TARGET"
            confidence = 0.86
            priority = "high"
            recommended_usage = "exclude"
            excluded_reason_type = "wrong_product_type"
            rationale = "Descrive un tipo prodotto differente o non coerente."
        elif "compatib" in kw or "compatibile" in kw:
            category = "VERIFY_PRODUCT_FEATURE"
            confidence = 0.66
            priority = "medium"
            recommended_usage = "verify"
            required_user_confirmation = True
            excluded_reason_type = "unsupported_feature"
            rationale = "Richiede conferma su compatibilita/caratteristica non certa."
        elif any(token in kw for token in ("adatto a", "compatibile con", "works with", "compatibility")):
            category = "VERIFY_PRODUCT_FEATURE"
            confidence = 0.64
            priority = "medium"
            recommended_usage = "verify"
            required_user_confirmation = True
            excluded_reason_type = "unsupported_feature"
            rationale = "Keyword legata a compatibilita/feature da confermare."
        elif kw in primary_set:
            category = "PRIMARY_SEO"
            confidence = 0.92
            priority = "high"
            recommended_usage = "title"
            rationale = "Match pieno con seed keyword primaria."
        elif any(token in kw for token in ambiguous_tokens) and len(words) <= 2:
            category = "OFF_TARGET"
            confidence = 0.71
            priority = "low"
            recommended_usage = "exclude"
            excluded_reason_type = "too_ambiguous"
            rationale = "Termine troppo generico/ambiguo per posizionamento affidabile."
        elif any(token and token in kw for token in feature_tokens):
            category = "FEATURE_KEYWORD"
            confidence = 0.82
            priority = "high"
            recommended_usage = "bullets_description"
            rationale = "Allineata ad attributi e segnali prodotto."
        elif len(words) >= 4:
            category = "LONG_TAIL"
            confidence = 0.75
            priority = "medium"
            recommended_usage = "backend_search_terms"
            rationale = "Long-tail utile per copertura semantica backend."
        elif any(token in kw for token in product_tokens):
            category = "SECONDARY_SEO"
            confidence = 0.72
            priority = "medium"
            recommended_usage = "bullets_description"
            rationale = "Keyword pertinente ma non core."
        else:
            category = "OFF_TARGET"
            confidence = 0.68
            priority = "medium"
            recommended_usage = "exclude"
            excluded_reason_type = "off_target"
            rationale = "Coerenza insufficiente con prodotto/categoria."

        return KeywordClassificationItem(
            keyword=kw,
            category=category,
            priority=priority,  # type: ignore[arg-type]
            recommended_usage=recommended_usage,  # type: ignore[arg-type]
            required_user_confirmation=required_user_confirmation,
            excluded_reason_type=excluded_reason_type,  # type: ignore[arg-type]
            confidence=confidence,
            rationale=rationale,
            source=row_source,
        )

    def build_plan(
        self,
        *,
        profile: ProductIntelligenceProfile,
        classifications: list[KeywordClassificationItem],
        confirmed_by_user: bool,
    ) -> ConfirmedKeywordPlan:
        by_category: dict[str, list[str]] = {}
        for item in classifications:
            by_category.setdefault(item.category, []).append(item.keyword)

        excluded_terms = {
            _norm(item.keyword)
            for item in classifications
            if item.category in ("OFF_TARGET", "NEGATIVE_KEYWORD", "BRANDED_COMPETITOR")
        }
        verify_terms = {
            _norm(item.keyword)
            for item in classifications
            if item.category == "VERIFY_PRODUCT_FEATURE" or item.required_user_confirmation
        }
        blocked = excluded_terms | verify_terms
        safe_categories = ("PRIMARY_SEO", "SECONDARY_SEO", "FEATURE_KEYWORD", "LONG_TAIL", "BACKEND_ONLY", "PPC_EXACT", "PPC_PHRASE")
        safe_keywords = _dedupe(
            [
                item.keyword
                for item in classifications
                if item.category in safe_categories and _norm(item.keyword) not in blocked
            ]
        )
        primary_candidates = _dedupe(
            by_category.get("PRIMARY_SEO", [])
            + [keyword for keyword in safe_keywords if keyword in profile.keyword_seed_pool]
        )
        secondary = _dedupe(by_category.get("SECONDARY_SEO", []) + by_category.get("LONG_TAIL", []))
        feature = _dedupe(by_category.get("FEATURE_KEYWORD", []))
        core_frontend = _dedupe([kw for kw in primary_candidates[:1] + secondary[:5] + feature[:4] if _norm(kw) not in blocked])
        support_frontend = _dedupe([kw for kw in secondary[5:12] + feature[4:8] if _norm(kw) not in blocked])

        backend_pool = _dedupe(
            by_category.get("BACKEND_ONLY", [])
            + by_category.get("PPC_EXACT", [])
            + by_category.get("PPC_PHRASE", [])
            + by_category.get("LONG_TAIL", [])[6:]
            + support_frontend
        )
        backend_reserved = [
            kw for kw in backend_pool if kw not in core_frontend and _norm(kw) not in blocked
        ][:24]

        definitively_excluded = [
            item
            for item in classifications
            if item.category in ("OFF_TARGET", "NEGATIVE_KEYWORD", "BRANDED_COMPETITOR")
        ]
        notes = [
            "Strong relevance beats raw search volume: non forzare keyword fuori target.",
            "Le keyword VERIFY_PRODUCT_FEATURE richiedono conferma prima dell'uso.",
            "Backend terms: privilegia varianti non gia coperte bene in title/bullets/description.",
        ]
        return ConfirmedKeywordPlan(
            rules_version=self.rules_version,
            keyword_primaria_finale=(core_frontend[0] if core_frontend else profile.product_detected),
            keyword_secondarie_prioritarie=secondary[:20],
            parole_da_spingere_nel_frontend=core_frontend[:16],
            parole_da_tenere_per_backend=backend_reserved,
            keyword_escluse_definitivamente=definitively_excluded[:50],
            note_su_keyword_da_non_forzare=notes,
            classificazioni_confermate=classifications[:180],
            confirmed_by_user=confirmed_by_user,
        )
