"""Request/response generazione sezioni listing (Prompt Orchestrator)."""

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.confirmed_product_strategy import ConfirmedProductStrategy
from app.schemas.keyword_planning import GeneratedFrontendContent

ListingSectionType = Literal["seo_title", "bullet_points", "description", "keyword_strategy"]

ValidationSeverity = Literal["error", "warning", "info"]


class InjectedRules(BaseModel):
    """Regole Amazon/brand e override numerici (estendibili da DB in futuro)."""

    amazon_constraints: str | None = None
    brand_guidelines: str | None = None
    banned_phrases: list[str] = Field(default_factory=list)
    seo_title_max_chars: int | None = None
    description_max_chars: int | None = None
    description_min_chars: int | None = None
    backend_search_terms_max_bytes: int | None = None


class ValidationIssue(BaseModel):
    code: str
    severity: ValidationSeverity
    message_it: str
    field: str | None = None


class ValidationReport(BaseModel):
    issues: list[ValidationIssue] = Field(default_factory=list)

    @property
    def has_errors(self) -> bool:
        return any(i.severity == "error" for i in self.issues)


class GenerateListingSectionRequest(BaseModel):
    strategy: ConfirmedProductStrategy
    section: ListingSectionType
    rules: InjectedRules | None = None
    include_raw_model_text: bool = False
    generated_frontend_content: GeneratedFrontendContent | None = None


class ListingSectionResult(BaseModel):
    """Una sezione generata; solo il campo pertinente a `section` è valorizzato."""

    section: ListingSectionType
    seo_title: str | None = None
    bullets: list[str] | None = None
    description: str | None = None
    backend_search_terms: str | None = None
    raw_model_text: str | None = None
    validation: ValidationReport = Field(default_factory=ValidationReport)
    post_processing_applied: list[str] = Field(default_factory=list)
