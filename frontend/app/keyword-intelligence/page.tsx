"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { DebugTraceCollapsible } from "@/components/keyword-intelligence/debug-trace-collapsible";
import { FinalKeywordPlanCard } from "@/components/keyword-intelligence/final-keyword-plan-card";
import { KeywordDecisionsBoard } from "@/components/keyword-intelligence/keyword-decisions-board";
import { ProductInterpretationCard } from "@/components/keyword-intelligence/product-interpretation-card";
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

function normalizeConfirmedPlan(raw: ConfirmedKeywordPlan): ConfirmedKeywordPlan {
  return {
    schema_version: raw.schema_version ?? "v1",
    keyword_primaria_finale: raw.keyword_primaria_finale ?? "",
    keyword_secondarie_prioritarie: raw.keyword_secondarie_prioritarie ?? [],
    parole_da_spingere_nel_frontend: raw.parole_da_spingere_nel_frontend ?? [],
    parole_da_tenere_per_backend: raw.parole_da_tenere_per_backend ?? [],
    keyword_escluse_definitivamente: raw.keyword_escluse_definitivamente ?? [],
    note_su_keyword_da_non_forzare: raw.note_su_keyword_da_non_forzare ?? [],
    classificazioni_confermate: raw.classificazioni_confermate ?? [],
    confirmed_by_user: Boolean(raw.confirmed_by_user),
  };
}

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
  const [confirmPlanByUser, setConfirmPlanByUser] = useState(false);

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
        const confirmedPlan = normalizeConfirmedPlan(confirmedRaw as ConfirmedKeywordPlan);
        setAnalysis({
          product_intelligence_profile: profileRaw as KeywordIntelligenceResponse["product_intelligence_profile"],
          keyword_classifications: (aiRaw as { keyword_classifications?: KeywordClassificationItem[] }).keyword_classifications ?? [],
          clarification_questions:
            (clarRaw as KeywordIntelligenceResponse["clarification_questions"]) ?? [],
          confirmed_keyword_plan: confirmedPlan,
        });
        setConfirmPlanByUser(Boolean(confirmedPlan.confirmed_by_user));
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
      confirm_plan_by_user: confirmPlanByUser,
      include_debug_trace: aiDebugEnabled,
    });
    setBusy(false);
    if (!response.ok) {
      setError(response.error?.message_it ?? it.workflowErrors.UNKNOWN);
      return;
    }
    const normalizedPlan = normalizeConfirmedPlan(response.intelligence.confirmed_keyword_plan);
    setAnalysis({ ...response.intelligence, confirmed_keyword_plan: normalizedPlan });
    setConfirmPlanByUser(Boolean(normalizedPlan.confirmed_by_user));
  }

  async function savePlan(): Promise<boolean> {
    if (!workItemId || !analysis) return false;
    setBusy(true);
    setHint(null);
    const loaded = await getWorkItemResult(workItemId);
    if (!loaded.ok) {
      setBusy(false);
      setError(`Impossibile leggere work item (${loaded.status}): ${loaded.error.message}`);
      return false;
    }
    const nextInput = {
      ...(loaded.data.input_data as Record<string, unknown>),
      [PRODUCT_INTELLIGENCE_PROFILE_KEY]: analysis.product_intelligence_profile,
      [KEYWORD_INTELLIGENCE_KEY]: { keyword_classifications: analysis.keyword_classifications },
      [KEYWORD_CLARIFICATIONS_KEY]: analysis.clarification_questions,
      [CONFIRMED_KEYWORD_PLAN_KEY]: { ...analysis.confirmed_keyword_plan, confirmed_by_user: confirmPlanByUser },
    };
    const updated = await updateWorkItemResult(workItemId, { input_data: nextInput, status: "in_progress" });
    setBusy(false);
    if (!updated.ok) {
      setError(`Salvataggio Keyword Intelligence fallito (${updated.status}): ${updated.error.message}`);
      return false;
    }
    setHint(k.saved);
    return true;
  }

  async function handleGoBack() {
    if (!workItemId) return;
    const saved = await savePlan();
    if (!saved) return;
    router.push(`/arricchimento-strategico?workItemId=${workItemId}`);
  }

  async function handleGoGenerate() {
    if (!workItemId) return;
    const saved = await savePlan();
    if (!saved) return;
    router.push(`/listing-generazione?workItemId=${workItemId}`);
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
      </section>

      {analysis ? (
        <>
          <ProductInterpretationCard profile={analysis.product_intelligence_profile} />
          <KeywordDecisionsBoard items={analysis.keyword_classifications} />
          <section className="surface-card rounded-4xl p-6 sm:p-8 space-y-5">
            <h2 className="text-lg font-semibold text-slate-900">{k.sections.clarifications}</h2>
            <div className="space-y-2">
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
          </section>
          <FinalKeywordPlanCard plan={{ ...analysis.confirmed_keyword_plan, confirmed_by_user: confirmPlanByUser }} />
          <section className="surface-card rounded-4xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <label className="flex items-center gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={confirmPlanByUser}
                  onChange={(e) => setConfirmPlanByUser(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {k.planConfirmLabel}
              </label>
              <span className="ml-auto rounded-xl bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {confirmPlanByUser ? k.planConfirmedBadge : k.planNotConfirmedBadge}
              </span>
            </div>
          </section>
          {aiDebugEnabled ? <DebugTraceCollapsible trace={analysis.debug_trace ?? null} /> : null}
          <section className="surface-card rounded-4xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => void handleGoBack()} disabled={busy} className="sm:mr-auto">
                Indietro
              </Button>
              {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
              <Button type="button" variant="secondary" onClick={() => void savePlan()} disabled={busy}>
                {k.save}
              </Button>
              <Button type="button" onClick={() => void handleGoGenerate()} disabled={busy || !confirmPlanByUser}>
                {k.goGenerate}
              </Button>
            </div>
          </section>
        </>
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
