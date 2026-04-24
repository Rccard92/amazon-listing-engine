"""Orchestratore: prompt → LLM → parse → post-process → validate."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field

from app.core.config import get_settings
from app.core.dogma import build_system_addon_for_section, get_dogma_bundle_for_settings
from app.schemas.analysis_exceptions import AnalysisPipelineError
from app.schemas.listing_generation import (
    GenerateListingSectionRequest,
    InjectedRules,
    ListingSectionResult,
    ValidationIssue,
    ValidationReport,
)
from app.services.listing_generation.llm_client import ListingLLMClient
from app.services.listing_generation.openai_llm_client import OpenAIListingLLMClient
from app.services.listing_generation.post_process.bullets import post_process_bullets
from app.services.listing_generation.post_process.description import post_process_description
from app.services.listing_generation.post_process.keyword_strategy import post_process_backend_search_terms
from app.services.listing_generation.post_process.title import post_process_seo_title
from app.services.listing_generation.prompts.bullets import (
    build_bullets_system_prompt,
    build_bullets_user_prompt,
)
from app.services.listing_generation.prompts.description import (
    build_description_system_prompt,
    build_description_user_prompt,
)
from app.services.listing_generation.prompts.keyword_strategy import (
    build_keyword_strategy_system_prompt,
    build_keyword_strategy_user_prompt,
)
from app.services.listing_generation.prompts.title import (
    build_title_system_prompt,
    build_title_user_prompt,
)
from app.services.listing_generation.validation.bullets import validate_bullets
from app.services.listing_generation.validation.common import merge_reports as merge_validation_reports
from app.services.listing_generation.validation.description import validate_description
from app.services.listing_generation.validation.keyword_strategy import validate_backend_search_terms
from app.services.listing_generation.validation.title import validate_seo_title


def _cleanup_bullet_line(line: str) -> str:
    value = line.strip()
    value = re.sub(r"^\s*(?:[-*•]\s+|\d+[\).]\s+)", "", value)
    return value.strip()


def _normalize_bullet_list(values: list[object], *, limit: int = 5) -> list[str]:
    out: list[str] = []
    for item in values:
        v = _cleanup_bullet_line(str(item))
        if v:
            out.append(v)
        if len(out) >= limit:
            break
    return out


def _extract_json_like(text: str) -> str | None:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    return text[start : end + 1]


def _parse_bullets_json(raw: str) -> list[str]:
    text = raw.strip()
    if not text:
        return []

    candidates = [text]
    embedded = _extract_json_like(text)
    if embedded and embedded != text:
        candidates.append(embedded)

    for candidate in candidates:
        try:
            data = json.loads(candidate)
        except json.JSONDecodeError:
            continue
        if isinstance(data, dict):
            arr = data.get("bullets")
            if isinstance(arr, list):
                return _normalize_bullet_list(arr)
            if isinstance(arr, str):
                # Supporta JSON con bullets serializzato come stringa multilinea.
                lines = [_cleanup_bullet_line(x) for x in arr.splitlines()]
                parsed = [x for x in lines if x]
                if parsed:
                    return parsed[:5]
        elif isinstance(data, list):
            parsed = _normalize_bullet_list(data)
            if parsed:
                return parsed

    # Fallback: split righe + rimozione prefissi elenco.
    lines = [_cleanup_bullet_line(ln) for ln in text.splitlines()]
    parsed = [ln for ln in lines if ln]
    return parsed[:5]


@dataclass
class ListingGenerationOrchestratorService:
    """Coordina generazione per singola sezione listing."""

    llm: ListingLLMClient = field(default_factory=OpenAIListingLLMClient)

    def generate(self, request: GenerateListingSectionRequest) -> ListingSectionResult:
        if not request.strategy.nome_prodotto.strip():
            raise AnalysisPipelineError(
                "STRATEGY_INCOMPLETE",
                http_status=422,
                message_it="Il nome prodotto nella strategia confermata è obbligatorio per generare.",
                details="nome_prodotto vuoto",
            )
        settings = get_settings()
        rules = request.rules or InjectedRules()
        merged_banned = list(rules.banned_phrases)
        pre = self._preflight(request)
        dogma = get_dogma_bundle_for_settings(settings.dogma_md_path)
        dogma_title = build_system_addon_for_section(dogma, "seo_title")
        dogma_bullets = build_system_addon_for_section(dogma, "bullet_points")
        dogma_desc = build_system_addon_for_section(dogma, "description")
        dogma_kw = build_system_addon_for_section(dogma, "keyword_strategy")

        if request.section == "seo_title":
            out = self._generate_title(request, settings, rules, merged_banned, dogma_title)
        elif request.section == "bullet_points":
            out = self._generate_bullets(request, settings, rules, merged_banned, dogma_bullets)
        elif request.section == "description":
            out = self._generate_description(request, settings, rules, merged_banned, dogma_desc)
        else:
            out = self._generate_keywords(request, settings, rules, merged_banned, dogma_kw)
        out.validation = merge_validation_reports(pre.validation, out.validation)
        return out

    def _preflight(self, request: GenerateListingSectionRequest) -> ListingSectionResult:
        """Warning non bloccanti prima del LLM."""
        issues: list[ValidationIssue] = []
        s = request.strategy
        if request.section in ("seo_title", "keyword_strategy") and not s.keyword_primarie:
            issues.append(
                ValidationIssue(
                    code="missing_primary_keywords",
                    severity="warning",
                    message_it="Nessuna keyword primaria in strategia: risultato SEO meno ancorato.",
                    field="keyword_primarie",
                )
            )
        if not (s.benefici_principali or s.usp_differenziazione) and request.section in (
            "bullet_points",
            "description",
        ):
            issues.append(
                ValidationIssue(
                    code="thin_strategy_benefits",
                    severity="warning",
                    message_it="Benefici o USP scarsi: conviene arricchire la strategia confermata.",
                    field="benefici_principali",
                )
            )
        return ListingSectionResult(section=request.section, validation=ValidationReport(issues=issues))

    def _generate_title(
        self, request, settings, rules: InjectedRules, merged_banned: list[str], dogma_addon: str
    ) -> ListingSectionResult:
        max_chars = rules.seo_title_max_chars or settings.listing_seo_title_max_chars
        rules_eff = rules.model_copy(update={"banned_phrases": merged_banned})
        system = build_title_system_prompt(dogma_addon=dogma_addon)
        user = build_title_user_prompt(request.strategy, rules_eff, max_chars=max_chars)
        raw = self.llm.generate_text(system_prompt=system, user_prompt=user, max_output_tokens=400)
        title, applied = post_process_seo_title(raw, max_chars=max_chars)
        report = validate_seo_title(title, max_chars=max_chars, rules=rules_eff)
        out = ListingSectionResult(
            section="seo_title",
            seo_title=title,
            raw_model_text=raw if request.include_raw_model_text else None,
            validation=report,
            post_processing_applied=applied,
        )
        return out

    def _generate_bullets(
        self, request, settings, rules: InjectedRules, merged_banned: list[str], dogma_addon: str
    ) -> ListingSectionResult:
        rules_eff = rules.model_copy(update={"banned_phrases": merged_banned})
        system = build_bullets_system_prompt(dogma_addon=dogma_addon)
        user = build_bullets_user_prompt(request.strategy, rules_eff)
        raw = self.llm.generate_text(system_prompt=system, user_prompt=user, max_output_tokens=900)
        parsed = _parse_bullets_json(raw)
        if not parsed:
            raise AnalysisPipelineError(
                "AI_OUTPUT_INVALID",
                http_status=502,
                message_it="Formato bullet non valido: impossibile estrarre un array di bullet.",
                details="Risposta modello non parseabile in bullets[]",
            )
        bullets, applied_pp = post_process_bullets(parsed)
        report = validate_bullets(bullets, rules=rules_eff)
        return ListingSectionResult(
            section="bullet_points",
            bullets=bullets,
            raw_model_text=raw if request.include_raw_model_text else None,
            validation=report,
            post_processing_applied=applied_pp,
        )

    def _generate_description(
        self, request, settings, rules: InjectedRules, merged_banned: list[str], dogma_addon: str
    ) -> ListingSectionResult:
        min_c = rules.description_min_chars or settings.listing_description_min_chars
        max_c = rules.description_max_chars or settings.listing_description_max_chars
        rules_eff = rules.model_copy(update={"banned_phrases": merged_banned})
        system = build_description_system_prompt(dogma_addon=dogma_addon)
        user = build_description_user_prompt(request.strategy, rules_eff, min_chars=min_c, max_chars=max_c)
        raw = self.llm.generate_text(system_prompt=system, user_prompt=user, max_output_tokens=2500)
        desc, applied = post_process_description(raw)
        report = validate_description(desc, min_chars=min_c, max_chars=max_c, rules=rules_eff)
        return ListingSectionResult(
            section="description",
            description=desc,
            raw_model_text=raw if request.include_raw_model_text else None,
            validation=report,
            post_processing_applied=applied,
        )

    def _generate_keywords(
        self, request, settings, rules: InjectedRules, merged_banned: list[str], dogma_addon: str
    ) -> ListingSectionResult:
        max_b = rules.backend_search_terms_max_bytes or settings.listing_backend_search_terms_max_bytes
        rules_eff = rules.model_copy(update={"banned_phrases": merged_banned})
        system = build_keyword_strategy_system_prompt(dogma_addon=dogma_addon)
        user = build_keyword_strategy_user_prompt(
            request.strategy,
            rules_eff,
            max_bytes=max_b,
            generated_frontend_content=request.generated_frontend_content,
        )
        raw = self.llm.generate_text(system_prompt=system, user_prompt=user, max_output_tokens=600)
        first_line = raw.splitlines()[0].strip() if raw.strip() else ""
        brand_tokens: list[str] = []
        if request.strategy.nome_prodotto:
            brand_tokens.append(request.strategy.nome_prodotto)
        terms, applied = post_process_backend_search_terms(first_line, max_bytes=max_b, brand_tokens=brand_tokens)
        report = validate_backend_search_terms(terms, max_bytes=max_b)
        return ListingSectionResult(
            section="keyword_strategy",
            backend_search_terms=terms,
            raw_model_text=raw if request.include_raw_model_text else None,
            validation=report,
            post_processing_applied=applied,
        )
