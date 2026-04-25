"use client";

import { it } from "@/lib/i18n/it";
import type { KeywordForensicTrace } from "@/lib/listing-generation";

type Props = {
  trace: KeywordForensicTrace | null | undefined;
  analysisSource: "fresh" | "saved";
  currentFingerprint: string;
  savedFingerprint: string | null;
};

const k = it.keywordIntelligence;

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function ForensicKeywordTracePanel({ trace, analysisSource, currentFingerprint, savedFingerprint }: Props) {
  const stale = Boolean(savedFingerprint && savedFingerprint !== currentFingerprint);
  return (
    <section className="surface-card rounded-4xl p-6 sm:p-8">
      <details>
        <summary className="cursor-pointer list-none">
          <span className="text-lg font-semibold text-slate-900">{k.forensic.title}</span>
          <p className="mt-1 text-sm text-slate-600">{k.forensic.subtitle}</p>
        </summary>
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
            <p>
              <span className="font-semibold">{k.forensic.analysisSourceLabel}:</span> {analysisSource}
            </p>
            <p>
              <span className="font-semibold">{k.forensic.staleLabel}:</span> {stale ? k.forensic.staleYes : k.forensic.staleNo}
            </p>
            <p>
              <span className="font-semibold">{k.forensic.currentFingerprintLabel}:</span> {currentFingerprint}
            </p>
            <p>
              <span className="font-semibold">{k.forensic.savedFingerprintLabel}:</span> {savedFingerprint ?? "-"}
            </p>
          </div>
          {!trace ? (
            <p className="text-sm text-slate-600">{k.forensic.empty}</p>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{k.forensic.pipeline}</p>
                <pre className="mt-2 overflow-auto text-xs text-slate-700">{pretty({
                  trace_id: trace.trace_id,
                  analysis_run_id: trace.analysis_run_id,
                  analysis_started_at: trace.analysis_started_at,
                  analysis_finished_at: trace.analysis_finished_at,
                  analysis_model_used: trace.analysis_model_used,
                  ai_context_builder_executed: trace.ai_context_builder_executed,
                  ai_refinement_executed: trace.ai_refinement_executed,
                  fallback_used: trace.fallback_used,
                  fallback_reason: trace.fallback_reason,
                  final_source_of_truth: trace.final_source_of_truth,
                  valid_ai_run: trace.valid_ai_run,
                  parsed_keyword_count: trace.parsed_keyword_count,
                  rules_version: trace.rules_version,
                  started_at: trace.started_at,
                  finished_at: trace.finished_at,
                  duration_ms: trace.duration_ms,
                  pipeline_mode: trace.pipeline_mode,
                  fallbacks: trace.fallbacks,
                })}</pre>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{k.forensic.stages}</p>
                <pre className="mt-2 overflow-auto text-xs text-slate-700">{pretty(trace.stage_outcomes)}</pre>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{k.forensic.keywordMap}</p>
                <pre className="mt-2 max-h-96 overflow-auto text-xs text-slate-700">{pretty(trace.keywords_debug_map)}</pre>
              </div>
              {Array.isArray(trace.explicit_debug_cases) && trace.explicit_debug_cases.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Casi debug espliciti</p>
                  <pre className="mt-2 max-h-96 overflow-auto text-xs text-slate-700">{pretty(trace.explicit_debug_cases)}</pre>
                </div>
              ) : null}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{k.forensic.freshness}</p>
                <pre className="mt-2 overflow-auto text-xs text-slate-700">{pretty(trace.freshness)}</pre>
              </div>
            </>
          )}
        </div>
      </details>
    </section>
  );
}
