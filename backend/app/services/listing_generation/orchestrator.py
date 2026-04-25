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
from app.services.debug_trace import DebugTraceCollector
from app.schemas.debug_trace import DebugTraceValidationCheck


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
        trace_enabled = bool(settings.enable_ai_debug_trace and request.include_debug_trace)
        rules = request.rules or InjectedRules()
        merged_banned = list(rules.banned_phrases)
        pre = self._preflight(request)
        dogma = get_dogma_bundle_for_settings(settings.dogma_md_path)
        dogma_title = build_system_addon_for_section(dogma, "seo_title")
        dogma_bullets = build_system_addon_for_section(dogma, "bullet_points")
        dogma_desc = build_system_addon_for_section(dogma, "description")
        dogma_kw = build_system_addon_for_section(dogma, "keyword_strategy")

        if request.section == "seo_title":
            out = self._generate_title(request, settings, rules, merged_banned, dogma_title, trace_enabled=trace_enabled)
        elif request.section == "bullet_points":
            out = self._generate_bullets(
                request, settings, rules, merged_banned, dogma_bullets, trace_enabled=trace_enabled
            )
        elif request.section == "description":
            out = self._generate_description(
                request, settings, rules, merged_banned, dogma_desc, trace_enabled=trace_enabled
            )
        else:
            out = self._generate_keywords(request, settings, rules, merged_banned, dogma_kw, trace_enabled=trace_enabled)
        out.validation = merge_validation_reports(pre.validation, out.validation)
        if trace_enabled and out.debug_trace is not None and pre.validation.issues:
            for issue in pre.validation.issues:
                out.debug_trace.data.validation_checks.append(
                    DebugTraceValidationCheck(code=issue.code, severity=issue.severity, message=issue.message_it)
                )
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
        self, request, settings, rules: InjectedRules, merged_banned: list[str], dogma_addon: str, *, trace_enabled: bool
    ) -> ListingSectionResult:
        trace = DebugTraceCollector(step="title_generation", enabled=trace_enabled)
        max_chars = rules.seo_title_max_chars or settings.listing_seo_title_max_chars
        rules_eff = rules.model_copy(update={"banned_phrases": merged_banned})
        system = build_title_system_prompt(dogma_addon=dogma_addon)
        user = build_title_user_prompt(request.strategy, rules_eff, max_chars=max_chars)
        if trace_enabled:
            trace.summary = "Titolo generato con vincoli SEO e DOGMA."
            trace.dogma_modules = ["DOGMA_GLOBAL", "DOGMA_TITLE"]
            trace.inputs_used = {
                "nome_prodotto": request.strategy.nome_prodotto,
                "categoria": request.strategy.categoria,
                "keyword_primarie": request.strategy.keyword_primarie,
                "keyword_secondarie": request.strategy.keyword_secondarie,
                "max_chars": max_chars,
            }
            trace.intermediate_outputs = {"system_prompt_chars": len(system), "user_prompt_chars": len(user)}
            trace.add_decision(label="Strategia titolo", reason="Priorita a keyword primaria con leggibilita naturale.")
        raw = self.llm.generate_text(system_prompt=system, user_prompt=user, max_output_tokens=400)
        title, applied = post_process_seo_title(raw, max_chars=max_chars)
        report = validate_seo_title(title, max_chars=max_chars, rules=rules_eff)
        if trace_enabled:
            trace.final_output = {"seo_title": title}
            trace.reasoning_summary = "Applicati vincoli lunghezza, coerenza keyword e normalizzazione post-process."
            trace.confidence_score = 1.0 if not report.issues else 0.82
            trace.add_block(title="Input usati", content=f"Nome prodotto: {request.strategy.nome_prodotto}\nMax chars: {max_chars}")
            trace.add_block(title="Regole DOGMA applicate", content="DOGMA_GLOBAL + DOGMA_TITLE")
            trace.add_block(title="Output finale", content=title or "-")
            for issue in report.issues:
                trace.add_validation(code=issue.code, severity=issue.severity, message=issue.message_it)
        out = ListingSectionResult(
            section="seo_title",
            seo_title=title,
            raw_model_text=raw if request.include_raw_model_text else None,
            validation=report,
            post_processing_applied=applied,
            debug_trace=trace.build(),
        )
        return out

    def _generate_bullets(
        self, request, settings, rules: InjectedRules, merged_banned: list[str], dogma_addon: str, *, trace_enabled: bool
    ) -> ListingSectionResult:
        trace = DebugTraceCollector(step="bullet_generation", enabled=trace_enabled)
        rules_eff = rules.model_copy(update={"banned_phrases": merged_banned})
        system = build_bullets_system_prompt(dogma_addon=dogma_addon)
        user = build_bullets_user_prompt(request.strategy, rules_eff)
        if trace_enabled:
            trace.summary = "Bullet generati in 5 ruoli conversion-oriented."
            trace.dogma_modules = ["DOGMA_GLOBAL", "DOGMA_BULLET"]
            trace.inputs_used = {
                "benefici_principali": request.strategy.benefici_principali,
                "usp_differenziazione": request.strategy.usp_differenziazione,
                "target_cliente": request.strategy.target_cliente,
            }
            trace.add_decision(label="Assegnazione bullet roles", reason="Bilanciamento tra beneficio, prova, obiezione e uso.")
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
        if trace_enabled:
            trace.intermediate_outputs = {"parsed_bullets_count": len(parsed)}
            trace.final_output = {"bullets": bullets}
            trace.reasoning_summary = "Estrazione JSON bullets + normalizzazione elenco + validazione quality."
            trace.confidence_score = 1.0 if not report.issues else 0.8
            trace.add_block(title="Regole DOGMA applicate", content="DOGMA_GLOBAL + DOGMA_BULLET")
            trace.add_block(
                title="Decisioni AI",
                content="\n".join(f"Bullet {i+1}: {b}" for i, b in enumerate(bullets[:5])) or "-",
            )
            for issue in report.issues:
                trace.add_validation(code=issue.code, severity=issue.severity, message=issue.message_it)
        return ListingSectionResult(
            section="bullet_points",
            bullets=bullets,
            raw_model_text=raw if request.include_raw_model_text else None,
            validation=report,
            post_processing_applied=applied_pp,
            debug_trace=trace.build(),
        )

    def _generate_description(
        self, request, settings, rules: InjectedRules, merged_banned: list[str], dogma_addon: str, *, trace_enabled: bool
    ) -> ListingSectionResult:
        trace = DebugTraceCollector(step="description_generation", enabled=trace_enabled)
        min_c = rules.description_min_chars or settings.listing_description_min_chars
        max_c = rules.description_max_chars or settings.listing_description_max_chars
        rules_eff = rules.model_copy(update={"banned_phrases": merged_banned})
        system = build_description_system_prompt(dogma_addon=dogma_addon)
        user = build_description_user_prompt(request.strategy, rules_eff, min_chars=min_c, max_chars=max_c)
        if trace_enabled:
            trace.summary = "Descrizione generata con logica paragrafi e vincoli lunghezza."
            trace.dogma_modules = ["DOGMA_GLOBAL", "DOGMA_DESCRIPTION"]
            trace.inputs_used = {
                "benefici_principali": request.strategy.benefici_principali,
                "gestione_obiezioni": request.strategy.gestione_obiezioni,
                "insight_recensioni_clienti": request.strategy.insight_recensioni_clienti,
                "min_chars": min_c,
                "max_chars": max_c,
            }
        raw = self.llm.generate_text(system_prompt=system, user_prompt=user, max_output_tokens=2500)
        desc, applied = post_process_description(raw)
        report = validate_description(desc, min_chars=min_c, max_chars=max_c, rules=rules_eff)
        if trace_enabled:
            trace.final_output = {"description": desc}
            trace.reasoning_summary = "Selezione struttura descrittiva con enfasi su USP, obiezioni e tono di categoria."
            trace.confidence_score = 1.0 if not report.issues else 0.81
            trace.add_block(title="Regole DOGMA applicate", content="DOGMA_GLOBAL + DOGMA_DESCRIPTION")
            trace.add_block(title="Controlli finali", content=f"Issue: {len(report.issues)}")
            for issue in report.issues:
                trace.add_validation(code=issue.code, severity=issue.severity, message=issue.message_it)
        return ListingSectionResult(
            section="description",
            description=desc,
            raw_model_text=raw if request.include_raw_model_text else None,
            validation=report,
            post_processing_applied=applied,
            debug_trace=trace.build(),
        )

    def _generate_keywords(
        self, request, settings, rules: InjectedRules, merged_banned: list[str], dogma_addon: str, *, trace_enabled: bool
    ) -> ListingSectionResult:
        trace = DebugTraceCollector(step="backend_keyword_generation", enabled=trace_enabled)
        max_b = rules.backend_search_terms_max_bytes or settings.listing_backend_search_terms_max_bytes
        rules_eff = rules.model_copy(update={"banned_phrases": merged_banned})
        system = build_keyword_strategy_system_prompt(dogma_addon=dogma_addon)
        user = build_keyword_strategy_user_prompt(
            request.strategy,
            rules_eff,
            max_bytes=max_b,
            generated_frontend_content=request.generated_frontend_content,
        )
        if trace_enabled:
            trace.summary = "Search terms backend generati su opportunita residue post-copy."
            trace.dogma_modules = ["DOGMA_GLOBAL", "DOGMA_KEYWORD_STRATEGY"]
            trace.inputs_used = {
                "keyword_primarie": request.strategy.keyword_primarie,
                "keyword_secondarie": request.strategy.keyword_secondarie,
                "max_bytes": max_b,
                "frontend_content_present": request.generated_frontend_content is not None,
            }
        raw = self.llm.generate_text(system_prompt=system, user_prompt=user, max_output_tokens=600)
        first_line = raw.splitlines()[0].strip() if raw.strip() else ""
        brand_tokens: list[str] = []
        if request.strategy.nome_prodotto:
            brand_tokens.append(request.strategy.nome_prodotto)
        terms, applied = post_process_backend_search_terms(first_line, max_bytes=max_b, brand_tokens=brand_tokens)
        report = validate_backend_search_terms(terms, max_bytes=max_b)
        if trace_enabled:
            trace.final_output = {"backend_search_terms": terms}
            trace.reasoning_summary = "Deduplicazione termini e compressione entro limite byte Amazon."
            trace.confidence_score = 1.0 if not report.issues else 0.79
            trace.add_block(title="Regole DOGMA applicate", content="DOGMA_GLOBAL + DOGMA_KEYWORD_STRATEGY")
            trace.add_block(title="Output finale", content=terms or "-")
            for issue in report.issues:
                trace.add_validation(code=issue.code, severity=issue.severity, message=issue.message_it)
        return ListingSectionResult(
            section="keyword_strategy",
            backend_search_terms=terms,
            raw_model_text=raw if request.include_raw_model_text else None,
            validation=report,
            post_processing_applied=applied,
            debug_trace=trace.build(),
        )
