"""Costruisce ConfirmedProductStrategy da input manuale, bozza AI o workflow competitor legacy."""

from __future__ import annotations

import re

from pydantic import ValidationError

from app.schemas.confirmed_product_strategy import ConfirmedProductStrategy, PriceTier
from app.schemas.product_ai_analysis import ProductStrategyDraft
from app.schemas.product_brief import ProductBrief
from app.schemas.strategic_enrichment import StrategicEnrichment
from app.schemas.keyword_intelligence import ConfirmedKeywordPlan
from app.schemas.keyword_planning import KeywordPlanning
from app.services.keyword_intelligence.plan_canonical import normalize_confirmed_keyword_plan
from app.services.manual_workflow.assemble_strategy import assemble_confirmed_strategy

# Chiave in `WorkItem.input_data` per strategia strutturata salvata dal form manuale (MVP manuale-first).
MANUAL_PRODUCT_STRATEGY_KEY = "manual_product_strategy"
# Brief strutturato (Fase 1) + arricchimento (Fase 2) — preferito rispetto al solo manual_product_strategy flat.
PRODUCT_BRIEF_KEY = "product_brief"
STRATEGIC_ENRICHMENT_KEY = "strategic_enrichment"
KEYWORD_PLANNING_KEY = "keyword_planning"
CONFIRMED_KEYWORD_PLAN_KEY = "confirmed_keyword_plan"


def _split_lines(value: str | None) -> list[str]:
    if not value or not str(value).strip():
        return []
    return [ln.strip() for ln in re.split(r"[\n,;]+", str(value)) if ln.strip()]


def _coerce_price_tier(hint: str | None, draft: ProductStrategyDraft | None) -> PriceTier:
    text = (hint or "").lower()
    if any(x in text for x in ("entry", "econom", "accessibil", "budget")):
        return "entry"
    if any(x in text for x in ("mid", "medio", "standard")):
        return "mid"
    if any(x in text for x in ("premium", "lusso", "alto")):
        return "premium"
    if draft is not None:
        return draft.inferred_price_tier
    return "unknown"


def _split_keywords(evident: list[str]) -> tuple[list[str], list[str]]:
    if not evident:
        return [], []
    n = len(evident)
    cut = max(1, (n + 1) // 2)
    return evident[:cut], evident[cut:]


def confirmed_from_draft_and_user(
    draft: ProductStrategyDraft | None,
    *,
    user_required: dict | None = None,
    user_confirmation: dict | None = None,
    auto_extracted: dict | None = None,
) -> ConfirmedProductStrategy:
    """Unisce draft AI e campi utente del workflow create-from-similar."""
    ur = user_required or {}
    uc = user_confirmation or {}
    auto = auto_extracted or {}

    nome = ""
    if draft and draft.normalized_product_name:
        nome = draft.normalized_product_name
    if not nome:
        nome = str(auto.get("title") or "").strip()
    if not nome:
        nome = "Prodotto"

    evident: list[str] = list(draft.evident_keywords) if draft else []
    primarie, secondarie = _split_keywords(evident)

    usp = (ur.get("unique_selling_points") or "").strip() if ur.get("unique_selling_points") else None
    if not usp and draft and draft.probable_usp:
        usp = draft.probable_usp

    strengths_txt = ur.get("actual_product_strengths")
    extra_features = _split_lines(str(strengths_txt) if strengths_txt else None)
    tech = list(draft.technical_features) if draft else []
    tech = tech + [x for x in extra_features if x not in tech]

    benefits = list(draft.main_benefits) if draft else []

    objections: list[str] = list(draft.probable_objections) if draft else []
    avoid = ur.get("claims_or_constraints_to_avoid")
    if avoid:
        objections = objections + [f"Da evitare: {avoid}"]

    target = draft.probable_target_customer if draft else None
    category = draft.category if draft else None

    price_tier = _coerce_price_tier(
        str(ur.get("target_price_level") or "").strip() or None,
        draft,
    )

    brand_gl = (ur.get("brand_guidelines") or "").strip() if ur.get("brand_guidelines") else None
    tone = (ur.get("tone_of_voice") or "").strip() if ur.get("tone_of_voice") else None
    linee = brand_gl
    if tone:
        linee = f"{linee}\n\nTono di voce: {tone}" if linee else f"Tono di voce: {tone}"

    emotional = draft.emotional_angle if draft else None
    reviews_hint = (uc.get("confirmation_notes") or "").strip() if uc.get("confirmation_notes") else None

    return ConfirmedProductStrategy(
        nome_prodotto=nome,
        categoria=category,
        caratteristiche_tecniche=tech,
        benefici_principali=benefits,
        usp_differenziazione=usp,
        target_cliente=target,
        gestione_obiezioni=objections,
        insight_recensioni_clienti=reviews_hint,
        keyword_primarie=primarie,
        keyword_secondarie=secondarie,
        linee_guida_brand=linee,
        angolo_emotivo=emotional,
        livello_prezzo=price_tier,
    )


def confirmed_strategy_from_manual_dict(raw: object) -> ConfirmedProductStrategy | None:
    """Se `raw` è un dict valido per ConfirmedProductStrategy, lo restituisce; altrimenti None."""
    if not isinstance(raw, dict):
        return None
    try:
        return ConfirmedProductStrategy.model_validate(raw)
    except ValidationError:
        return None


def confirmed_strategy_from_work_item_input(input_data: dict) -> ConfirmedProductStrategy:
    """Best-effort: `product_brief` + `strategic_enrichment`, poi `manual_product_strategy`, poi legacy competitor."""
    pb_raw = input_data.get(PRODUCT_BRIEF_KEY)
    if isinstance(pb_raw, dict):
        brief = ProductBrief.model_validate(pb_raw)
        enr_raw = input_data.get(STRATEGIC_ENRICHMENT_KEY)
        kwp_raw = input_data.get(KEYWORD_PLANNING_KEY)
        ckp_raw = input_data.get(CONFIRMED_KEYWORD_PLAN_KEY)
        enr: StrategicEnrichment | None = None
        kwp: KeywordPlanning | None = None
        ckp: ConfirmedKeywordPlan | None = None
        if isinstance(enr_raw, dict):
            enr = StrategicEnrichment.model_validate(enr_raw)
        if isinstance(kwp_raw, dict):
            kwp = KeywordPlanning.model_validate(kwp_raw)
        if isinstance(ckp_raw, dict):
            ckp = ConfirmedKeywordPlan.model_validate(ckp_raw)
        assembled = assemble_confirmed_strategy(brief, enr)
        if ckp is not None:
            ckp = normalize_confirmed_keyword_plan(ckp)
            inc = [k for k in ckp.included_keywords if str(k).strip()]
            if inc:
                primarie = [inc[0]]
                secondarie = inc[1:] if len(inc) > 1 else []
            elif ckp.keyword_primaria_finale.strip():
                primarie = [ckp.keyword_primaria_finale.strip()]
                secondarie = list(ckp.keyword_secondarie_prioritarie or assembled.keyword_secondarie)
            else:
                primarie = assembled.keyword_primarie
                secondarie = ckp.keyword_secondarie_prioritarie or assembled.keyword_secondarie
            assembled = assembled.model_copy(update={"keyword_primarie": primarie, "keyword_secondarie": secondarie})
        return assembled.model_copy(update={"confirmed_keyword_plan": ckp, "keyword_planning": kwp})

    manual = input_data.get(MANUAL_PRODUCT_STRATEGY_KEY)
    parsed_manual = confirmed_strategy_from_manual_dict(manual)
    if parsed_manual is not None:
        return parsed_manual

    draft_raw = input_data.get("ai_strategy_draft")
    draft: ProductStrategyDraft | None = None
    if isinstance(draft_raw, dict):
        draft = ProductStrategyDraft.model_validate(draft_raw)
    auto = input_data.get("auto_extracted")
    auto_dict = auto if isinstance(auto, dict) else {}
    ur = input_data.get("user_required")
    uc = input_data.get("user_confirmation")
    return confirmed_from_draft_and_user(
        draft,
        user_required=ur if isinstance(ur, dict) else {},
        user_confirmation=uc if isinstance(uc, dict) else {},
        auto_extracted=auto_dict,
    )
