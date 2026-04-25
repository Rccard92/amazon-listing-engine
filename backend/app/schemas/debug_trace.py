"""Schema explainability strutturata per Debug AI (temporaneo)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class DebugTraceDecision(BaseModel):
    label: str
    reason: str


class DebugTraceValidationCheck(BaseModel):
    code: str
    severity: str = "info"
    message: str


class DebugTraceBlock(BaseModel):
    title: str
    content: str


class DebugTraceStep(BaseModel):
    step: str
    dogma_modules: list[str] = Field(default_factory=list)
    inputs_used: dict = Field(default_factory=dict)
    intermediate_outputs: dict = Field(default_factory=dict)
    decisions: list[DebugTraceDecision] = Field(default_factory=list)
    questions_raised: list[str] = Field(default_factory=list)
    confidence_score: float | None = None
    validation_checks: list[DebugTraceValidationCheck] = Field(default_factory=list)
    final_output: dict | str | None = None
    reasoning_summary: str = ""
    ui_blocks: list[DebugTraceBlock] = Field(default_factory=list)


class DebugTrace(BaseModel):
    trace_version: str = "v1"
    step: str
    summary: str = ""
    data: DebugTraceStep
