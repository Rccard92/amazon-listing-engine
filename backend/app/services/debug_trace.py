"""Collector leggero per tracce explainability (Debug AI)."""

from __future__ import annotations

from dataclasses import dataclass, field

from app.schemas.debug_trace import (
    DebugTrace,
    DebugTraceBlock,
    DebugTraceDecision,
    DebugTraceStep,
    DebugTraceValidationCheck,
)


@dataclass
class DebugTraceCollector:
    step: str
    enabled: bool
    summary: str = ""
    dogma_modules: list[str] = field(default_factory=list)
    inputs_used: dict = field(default_factory=dict)
    intermediate_outputs: dict = field(default_factory=dict)
    decisions: list[DebugTraceDecision] = field(default_factory=list)
    questions_raised: list[str] = field(default_factory=list)
    confidence_score: float | None = None
    validation_checks: list[DebugTraceValidationCheck] = field(default_factory=list)
    final_output: dict | str | None = None
    reasoning_summary: str = ""
    ui_blocks: list[DebugTraceBlock] = field(default_factory=list)

    def add_decision(self, *, label: str, reason: str) -> None:
        if not self.enabled:
            return
        self.decisions.append(DebugTraceDecision(label=label, reason=reason))

    def add_validation(self, *, code: str, severity: str, message: str) -> None:
        if not self.enabled:
            return
        self.validation_checks.append(DebugTraceValidationCheck(code=code, severity=severity, message=message))

    def add_block(self, *, title: str, content: str) -> None:
        if not self.enabled:
            return
        self.ui_blocks.append(DebugTraceBlock(title=title, content=content))

    def build(self) -> DebugTrace | None:
        if not self.enabled:
            return None
        return DebugTrace(
            step=self.step,
            summary=self.summary,
            data=DebugTraceStep(
                step=self.step,
                dogma_modules=self.dogma_modules,
                inputs_used=self.inputs_used,
                intermediate_outputs=self.intermediate_outputs,
                decisions=self.decisions,
                questions_raised=self.questions_raised,
                confidence_score=self.confidence_score,
                validation_checks=self.validation_checks,
                final_output=self.final_output,
                reasoning_summary=self.reasoning_summary,
                ui_blocks=self.ui_blocks,
            ),
        )
