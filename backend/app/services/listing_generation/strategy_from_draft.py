"""Costruisce ConfirmedProductStrategy da bozza AI e dati work item (competitor workflow)."""

from __future__ import annotations

import re

from app.schemas.confirmed_product_strategy import ConfirmedProductStrategy, PriceTier
from app.schemas.product_ai_analysis import ProductStrategyDraft


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


def confirmed_strategy_from_work_item_input(input_data: dict) -> ConfirmedProductStrategy:
    """Estrae dalla struttura `input_data` salvata nel work item competitor."""
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
