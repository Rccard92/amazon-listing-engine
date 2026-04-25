"""Schema per la fase Keyword Intelligence (Fase 3)."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

from app.schemas.debug_trace import DebugTrace

KeywordCategory = Literal[
    "PRIMARY_SEO",
    "SECONDARY_SEO",
    "FEATURE_KEYWORD",
    "LONG_TAIL",
    "BACKEND_ONLY",
    "PPC_EXACT",
    "PPC_PHRASE",
    "BRANDED_COMPETITOR",
    "OFF_TARGET",
    "VERIFY_PRODUCT_FEATURE",
    "NEGATIVE_KEYWORD",
]

KeywordPriority = Literal["high", "medium", "low"]
KeywordUsage = Literal["title", "bullets_description", "backend_search_terms", "exclude", "verify"]
KeywordPipelineMode = Literal["legacy", "three_layer"]
ExcludedReasonType = Literal[
    "off_target",
    "competitor_brand",
    "invalid_feature_match",
    "irrelevant_intent",
    "wrong_product_type",
    "unsupported_feature",
    "too_ambiguous",
    "forbidden_concept",
]


class KeywordIntelligenceUploadedFile(BaseModel):
    filename: str
    file_type: Literal["csv", "xlsx", "unknown"] = "unknown"


class Helium10KeywordRow(BaseModel):
    keyword: str = ""
    search_volume: int | None = None
    cpr: int | None = None
    source_row: int | None = None


class ProductAttributeSignal(BaseModel):
    name: str
    value: str
    confidence: float = 0.0
    source: str = "derived"


class ProductKeywordContext(BaseModel):
    schema_version: str = "v1"
    product_type: str = ""
    marketplace_category: str = ""
    brand: str = ""
    confirmed_attributes: list[ProductAttributeSignal] = Field(default_factory=list)
    uncertain_attributes: list[ProductAttributeSignal] = Field(default_factory=list)
    excluded_attributes: list[ProductAttributeSignal] = Field(default_factory=list)
    allowed_keyword_concepts: list[str] = Field(default_factory=list)
    forbidden_keyword_concepts: list[str] = Field(default_factory=list)
    possible_competitor_brands: list[str] = Field(default_factory=list)
    clarification_questions: list[dict[str, str]] = Field(default_factory=list)
    confidence_score: float = 0.0
    reasoning_summary: str = ""


class KeywordVetoResult(BaseModel):
    allowed_keywords: list[str] = Field(default_factory=list)
    verify_keywords: list[str] = Field(default_factory=list)
    excluded_keywords: list[str] = Field(default_factory=list)
    summary: dict[str, int] = Field(default_factory=dict)


class ProductIntelligenceProfile(BaseModel):
    schema_version: str = "v1"
    rules_version: str = "keyword_intelligence_rules_v1"
    product_detected: str = ""
    category_detected: str | None = None
    main_detected_attributes: list[ProductAttributeSignal] = Field(default_factory=list)
    excluded_attributes: list[str] = Field(default_factory=list)
    uncertain_attributes: list[str] = Field(default_factory=list)
    keyword_seed_pool: list[str] = Field(default_factory=list)
    confidence_score: float = 0.0


class KeywordClassificationItem(BaseModel):
    keyword: str
    category: KeywordCategory
    priority: KeywordPriority = "medium"
    recommended_usage: KeywordUsage = "bullets_description"
    required_user_confirmation: bool = False
    excluded_reason_type: ExcludedReasonType | None = None
    confidence: float = 0.0
    rationale: str = ""
    source: str = "helium10"


class ClarificationQuestion(BaseModel):
    id: str
    question: str
    reason: str
    priority: Literal["low", "medium", "high"] = "medium"
    answer: str | None = None


class ConfirmedKeywordPlan(BaseModel):
    schema_version: str = "v1"
    rules_version: str = "keyword_intelligence_rules_v1"
    keyword_primaria_finale: str = ""
    keyword_secondarie_prioritarie: list[str] = Field(default_factory=list)
    parole_da_spingere_nel_frontend: list[str] = Field(default_factory=list)
    parole_da_tenere_per_backend: list[str] = Field(default_factory=list)
    keyword_escluse_definitivamente: list[KeywordClassificationItem] = Field(default_factory=list)
    note_su_keyword_da_non_forzare: list[str] = Field(default_factory=list)
    classificazioni_confermate: list[KeywordClassificationItem] = Field(default_factory=list)
    confirmed_by_user: bool = False
    pipeline_metadata: dict[str, str | int | bool] | None = None
    vetoed_keywords: list[KeywordClassificationItem] = Field(default_factory=list)


class KeywordIntelligenceRequest(BaseModel):
    manual_seed_keywords: list[str] = Field(default_factory=list)
    helium10_rows: list[Helium10KeywordRow] = Field(default_factory=list)
    uploaded_files: list[KeywordIntelligenceUploadedFile] = Field(default_factory=list)
    clarification_answers: dict[str, str] = Field(default_factory=dict)
    confirm_plan_by_user: bool = False
    include_debug_trace: bool = False
    include_forensic_trace: bool = False
    pipeline_mode: KeywordPipelineMode = "legacy"
    enable_ai_context_builder: bool = False
    enable_deterministic_veto: bool = True
    enable_ai_refinement: bool = False
    require_ai_execution: bool = False
    forensic_fingerprint: str | None = None
    forensic_input_meta: dict[str, Any] = Field(default_factory=dict)


class KeywordIntelligenceResponse(BaseModel):
    product_intelligence_profile: ProductIntelligenceProfile
    keyword_classifications: list[KeywordClassificationItem] = Field(default_factory=list)
    clarification_questions: list[ClarificationQuestion] = Field(default_factory=list)
    confirmed_keyword_plan: ConfirmedKeywordPlan
    rules_applied: str = "keyword_intelligence_rules_v1"
    pipeline_applied: KeywordPipelineMode = "legacy"
    context_profile_version: str | None = None
    keyword_context: ProductKeywordContext | None = None
    veto_summary: dict[str, int] | None = None
    refinement_summary: dict[str, int] | None = None
    forensic_trace: dict[str, Any] | None = None
    debug_trace: DebugTrace | None = None
    analysis_run_id: str | None = None
    analysis_started_at: str | None = None
    analysis_finished_at: str | None = None
    analysis_model_used: str | None = None
    ai_context_builder_executed: bool = False
    ai_refinement_executed: bool = False
    fallback_used: bool = False
    fallback_reason: str | None = None
    model_name: str | None = None
    parsed_keyword_count: int = 0
    final_source_of_truth: Literal["ai", "fallback", "stale_cache", "unknown"] = "unknown"
    valid_ai_run: bool = False
    route_called: bool = False
    file_parsed: bool = False
    rules_loaded: bool = False
    ai_context_builder_entered: bool = False
    ai_context_builder_completed: bool = False
    openai_client_called: bool = False
    ai_refinement_entered: bool = False
    ai_refinement_completed: bool = False
    stale_result_used: bool = False
    reason_if_ai_not_called: str | None = None
    reason_if_fallback_used: str | None = None
