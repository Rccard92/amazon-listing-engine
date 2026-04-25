"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AiTracePanel } from "@/components/ai-trace/ai-trace-panel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadDropzone } from "@/components/ui/upload-dropzone";
import { fetchFeatureFlags } from "@/lib/api";
import { it } from "@/lib/i18n/it";
import {
  CONFIRMED_KEYWORD_PLAN_KEY,
  KEYWORD_CLARIFICATIONS_KEY,
  KEYWORD_INTELLIGENCE_KEY,
  PRODUCT_INTELLIGENCE_PROFILE_KEY,
  requestKeywordIntelligenceForWorkItem,
  type ConfirmedKeywordPlan,
  type KeywordClassificationItem,
  type KeywordIntelligenceResponse,
  type KeywordIntelligenceUploadedFile,
} from "@/lib/listing-generation";
import { getWorkItemResult, updateWorkItemResult } from "@/lib/work-items";

const k = it.keywordIntelligence;

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function parseCsvKeywords(file: File): Promise<{ keyword: string; source_row: number }[]> {
  const text = await file.text();
  const rows = text.split(/\r?\n/).filter(Boolean);
  if (!rows.length) return [];
  const header = rows[0].split(",").map((x) => x.trim().toLowerCase());
  const keywordIdx = Math.max(header.indexOf("keyword"), header.indexOf("search term"), header.indexOf("search_term"));
  const idx = keywordIdx >= 0 ? keywordIdx : 0;
  return rows
    .slice(1)
    .map((line, i) => ({ keyword: String(line.split(",")[idx] ?? "").trim(), source_row: i + 2 }))
    .filter((x) => x.keyword.length > 0);
}

function KeywordIntelligenceInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workItemId = searchParams.get("workItemId");

  const [manualSeedsText, setManualSeedsText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<KeywordIntelligenceUploadedFile[]>([]);
  const [heliumRows, setHeliumRows] = useState<{ keyword: string; source_row: number }[]>([]);
  const [analysis, setAnalysis] = useState<KeywordIntelligenceResponse | null>(null);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [aiDebugEnabled, setAiDebugEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadFeatures() {
      const features = await fetchFeatureFlags();
      if (cancelled || !features) return;
      setAiDebugEnabled(Boolean(features.ai_debug_trace_enabled));
    }
    void loadFeatures();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!workItemId) return;
      const loaded = await getWorkItemResult(workItemId);
      if (!loaded.ok || cancelled) return;
      const input = loaded.data.input_data as Record<string, unknown>;
      const aiRaw = input[KEYWORD_INTELLIGENCE_KEY];
      const profileRaw = input[PRODUCT_INTELLIGENCE_PROFILE_KEY];
      const clarRaw = input[KEYWORD_CLARIFICATIONS_KEY];
      const confirmedRaw = input[CONFIRMED_KEYWORD_PLAN_KEY];
      if (aiRaw && profileRaw && confirmedRaw && typeof aiRaw === "object" && typeof profileRaw === "object") {
        setAnalysis({
          product_intelligence_profile: profileRaw as KeywordIntelligenceResponse["product_intelligence_profile"],
          keyword_classifications: (aiRaw as { keyword_classifications?: KeywordClassificationItem[] }).keyword_classifications ?? [],
          clarification_questions:
            (clarRaw as KeywordIntelligenceResponse["clarification_questions"]) ?? [],
          confirmed_keyword_plan: confirmedRaw as ConfirmedKeywordPlan,
        });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [workItemId]);

  const manualSeeds = useMemo(() => splitLines(manualSeedsText), [manualSeedsText]);

  async function onFilesSelected(files: File[]) {
    const nextFiles: KeywordIntelligenceUploadedFile[] = files.map((f) => ({
      filename: f.name,
      file_type: f.name.toLowerCase().endsWith(".csv") ? "csv" : f.name.toLowerCase().endsWith(".xlsx") ? "xlsx" : "unknown",
    }));
    setUploadedFiles(nextFiles);

    const csvRows: { keyword: string; source_row: number }[] = [];
    for (const file of files) {
      if (file.name.toLowerCase().endsWith(".csv")) {
        const parsed = await parseCsvKeywords(file);
        csvRows.push(...parsed);
      }
    }
    setHeliumRows(csvRows);
  }

  async function runIntelligence() {
    if (!workItemId) return;
    setBusy(true);
    setError(null);
    const response = await requestKeywordIntelligenceForWorkItem(workItemId, {
      manual_seed_keywords: manualSeeds,
      helium10_rows: heliumRows,
      uploaded_files: uploadedFiles,
      clarification_answers: clarificationAnswers,
      include_debug_trace: aiDebugEnabled,
    });
    setBusy(false);
    if (!response.ok) {
      setError(response.error?.message_it ?? it.workflowErrors.UNKNOWN);
      return;
    }
    setAnalysis(response.intelligence);
  }

  async function savePlan() {
    if (!workItemId || !analysis) return;
    setBusy(true);
    setHint(null);
    const loaded = await getWorkItemResult(workItemId);
    if (!loaded.ok) {
      setBusy(false);
      setError(`Impossibile leggere work item (${loaded.status}): ${loaded.error.message}`);
      return;
    }
    const nextInput = {
      ...(loaded.data.input_data as Record<string, unknown>),
      [PRODUCT_INTELLIGENCE_PROFILE_KEY]: analysis.product_intelligence_profile,
      [KEYWORD_INTELLIGENCE_KEY]: { keyword_classifications: analysis.keyword_classifications },
      [KEYWORD_CLARIFICATIONS_KEY]: analysis.clarification_questions,
      [CONFIRMED_KEYWORD_PLAN_KEY]: analysis.confirmed_keyword_plan,
    };
    const updated = await updateWorkItemResult(workItemId, { input_data: nextInput, status: "in_progress" });
    setBusy(false);
    if (!updated.ok) {
      setError(`Salvataggio Keyword Intelligence fallito (${updated.status}): ${updated.error.message}`);
      return;
    }
    setHint(k.saved);
  }

  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.badge}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{k.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{k.subtitle}</p>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </header>

      <section className="surface-card rounded-4xl p-6 sm:p-8 space-y-4">
        <div>
          <p className="text-sm font-medium text-slate-800">{k.uploadTitle}</p>
          <p className="text-xs text-slate-500">{k.uploadHint}</p>
          <div className="mt-2">
            <UploadDropzone accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onFilesSelected={(files) => void onFilesSelected(files)} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-800">{k.manualSeedsLabel}</label>
          <Textarea rows={4} className="mt-1" value={manualSeedsText} onChange={(e) => setManualSeedsText(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void runIntelligence()} disabled={busy}>
            {busy ? it.common.loading : k.run}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push(`/keyword-planning?workItemId=${workItemId ?? ""}`)}>
            {k.goLegacy}
          </Button>
        </div>
        {aiDebugEnabled ? <AiTracePanel trace={analysis?.debug_trace} /> : null}
      </section>

      {analysis ? (
        <section className="surface-card rounded-4xl p-6 sm:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{k.sections.detected}</h2>
            <p className="mt-1 text-sm text-slate-700">
              {analysis.product_intelligence_profile.product_detected || "-"} ·{" "}
              {analysis.product_intelligence_profile.category_detected || "categoria non definita"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{k.sections.attrsMain}</h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {analysis.product_intelligence_profile.main_detected_attributes.slice(0, 8).map((a, i) => (
                <li key={`${a.name}-${i}`}>{a.name}: {a.value}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{k.sections.attrsExcluded}</h3>
            <p className="mt-1 text-sm text-slate-700">
              {analysis.product_intelligence_profile.excluded_attributes.join(" | ") || "-"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{k.sections.attrsUncertain}</h3>
            <p className="mt-1 text-sm text-slate-700">
              {analysis.product_intelligence_profile.uncertain_attributes.join(" | ") || "-"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{k.sections.clarifications}</h3>
            <div className="mt-2 space-y-2">
              {analysis.clarification_questions.length === 0 ? (
                <p className="text-sm text-slate-700">Nessuna domanda aperta.</p>
              ) : (
                analysis.clarification_questions.map((q) => (
                  <div key={q.id} className="rounded-2xl border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-900">{q.question}</p>
                    <p className="text-xs text-slate-500 mt-1">{q.reason}</p>
                    <Textarea
                      rows={2}
                      className="mt-2"
                      value={clarificationAnswers[q.id] ?? q.answer ?? ""}
                      onChange={(e) => setClarificationAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{k.sections.classifications}</h3>
            <p className="mt-1 text-xs text-slate-500">
              {analysis.keyword_classifications.length} keyword classificate
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{k.sections.confirmedPlan}</h3>
            <p className="mt-1 text-sm text-slate-700">
              Primaria: {analysis.confirmed_keyword_plan.keyword_primaria_finale || "-"}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
            <Button type="button" variant="secondary" onClick={() => void savePlan()} disabled={busy}>
              {k.save}
            </Button>
            <Button type="button" onClick={() => router.push(`/listing-generazione?workItemId=${workItemId ?? ""}`)} disabled={busy}>
              {k.goGenerate}
            </Button>
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default function KeywordIntelligencePage() {
  return (
    <Suspense
      fallback={
        <main className="p-8">
          <p className="text-sm text-slate-600">{it.common.loading}</p>
        </main>
      }
    >
      <KeywordIntelligenceInner />
    </Suspense>
  );
}
