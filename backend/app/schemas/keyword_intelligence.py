"""Schema per la fase Keyword Intelligence (Fase 3)."""

from __future__ import annotations

from typing import Literal

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


class ProductIntelligenceProfile(BaseModel):
    schema_version: str = "v1"
    product_detected: str = ""
    category_detected: str | None = None
    main_detected_attributes: list[ProductAttributeSignal] = Field(default_factory=list)
    excluded_attributes: list[str] = Field(default_factory=list)
    uncertain_attributes: list[str] = Field(default_factory=list)
    keyword_seed_pool: list[str] = Field(default_factory=list)


class KeywordClassificationItem(BaseModel):
    keyword: str
    category: KeywordCategory
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
    keyword_primaria_finale: str = ""
    keyword_secondarie_prioritarie: list[str] = Field(default_factory=list)
    parole_da_spingere_nel_frontend: list[str] = Field(default_factory=list)
    parole_da_tenere_per_backend: list[str] = Field(default_factory=list)
    note_su_keyword_da_non_forzare: list[str] = Field(default_factory=list)
    classificazioni_confermate: list[KeywordClassificationItem] = Field(default_factory=list)
    confirmed_by_user: bool = False


class KeywordIntelligenceRequest(BaseModel):
    manual_seed_keywords: list[str] = Field(default_factory=list)
    helium10_rows: list[Helium10KeywordRow] = Field(default_factory=list)
    uploaded_files: list[KeywordIntelligenceUploadedFile] = Field(default_factory=list)
    clarification_answers: dict[str, str] = Field(default_factory=dict)
    include_debug_trace: bool = False


class KeywordIntelligenceResponse(BaseModel):
    product_intelligence_profile: ProductIntelligenceProfile
    keyword_classifications: list[KeywordClassificationItem] = Field(default_factory=list)
    clarification_questions: list[ClarificationQuestion] = Field(default_factory=list)
    confirmed_keyword_plan: ConfirmedKeywordPlan
    debug_trace: DebugTrace | None = None
