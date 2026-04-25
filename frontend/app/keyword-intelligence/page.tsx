"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { DebugTraceCollapsible } from "@/components/keyword-intelligence/debug-trace-collapsible";
import { FinalKeywordPlanCard } from "@/components/keyword-intelligence/final-keyword-plan-card";
import { ForensicKeywordTracePanel } from "@/components/keyword-intelligence/forensic-keyword-trace-panel";
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
const KEYWORD_INTELLIGENCE_UPLOAD_STATE_KEY = "keyword_intelligence_upload_state";
const KEYWORD_INTELLIGENCE_MANUAL_SEEDS_TEXT_KEY = "keyword_intelligence_manual_seeds_text";
const KEYWORD_INTELLIGENCE_CONTEXT_KEY = "keyword_intelligence_context";
const KEYWORD_INTELLIGENCE_VETO_SUMMARY_KEY = "keyword_intelligence_veto_summary";
const KEYWORD_INTELLIGENCE_PIPELINE_VERSION_KEY = "keyword_intelligence_pipeline_version";
const KEYWORD_INTELLIGENCE_ROWS_KEY = "keyword_intelligence_helium_rows";
const KEYWORD_INTELLIGENCE_FORENSIC_TRACE_KEY = "keyword_intelligence_forensic_trace";

type PersistedUploadState = {
  files: KeywordIntelligenceUploadedFile[];
  parsed_rows_count: number;
  uploaded_at_iso: string | null;
};

type UploadRuntimeMeta = {
  filename: string;
  file_type: "csv" | "xlsx" | "unknown";
  file_size_bytes: number;
};

type KeywordRunMeta = {
  analysis_run_id: string | null;
  analysis_started_at: string | null;
  analysis_finished_at: string | null;
  analysis_model_used: string | null;
  rows_count: number;
  rules_version: string | null;
  files_summary: string | null;
};

function normalizeConfirmedPlan(raw: ConfirmedKeywordPlan): ConfirmedKeywordPlan {
  return {
    schema_version: raw.schema_version ?? "v1",
    rules_version: raw.rules_version ?? "keyword_intelligence_rules_v1",
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

function buildFingerprint(payload: Record<string, unknown>): string {
  const raw = JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return `fp_${hash.toString(16)}`;
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
  const [uploadState, setUploadState] = useState<PersistedUploadState>({
    files: [],
    parsed_rows_count: 0,
    uploaded_at_iso: null,
  });
  const [uploadRuntimeMeta, setUploadRuntimeMeta] = useState<UploadRuntimeMeta[]>([]);
  const [analysis, setAnalysis] = useState<KeywordIntelligenceResponse | null>(null);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [aiDebugEnabled, setAiDebugEnabled] = useState(false);
  const [threeLayerEnabled, setThreeLayerEnabled] = useState(false);
  const [contextBuilderEnabled, setContextBuilderEnabled] = useState(false);
  const [deterministicVetoEnabled, setDeterministicVetoEnabled] = useState(true);
  const [refinementEnabled, setRefinementEnabled] = useState(false);
  const [forensicDebugEnabled, setForensicDebugEnabled] = useState(false);
  const [confirmPlanByUser, setConfirmPlanByUser] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [analysisSource, setAnalysisSource] = useState<"fresh" | "saved">("saved");
  const [savedFingerprint, setSavedFingerprint] = useState<string | null>(null);
  const [lastRunMeta, setLastRunMeta] = useState<KeywordRunMeta | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadFeatures() {
      const features = await fetchFeatureFlags();
      if (cancelled || !features) return;
      setAiDebugEnabled(Boolean(features.ai_debug_trace_enabled));
      setThreeLayerEnabled(Boolean(features.keyword_three_layer_enabled));
      setContextBuilderEnabled(Boolean(features.keyword_ai_context_builder_enabled));
      setDeterministicVetoEnabled(features.keyword_deterministic_veto_enabled !== false);
      setRefinementEnabled(Boolean(features.keyword_ai_refinement_enabled));
      setForensicDebugEnabled(Boolean(features.keyword_forensic_debug_enabled));
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
      const uploadRaw = input[KEYWORD_INTELLIGENCE_UPLOAD_STATE_KEY];
      const manualSeedsRaw = input[KEYWORD_INTELLIGENCE_MANUAL_SEEDS_TEXT_KEY];
      const savedMetaRaw = input["keyword_intelligence_meta"];
      const rowsRaw = input[KEYWORD_INTELLIGENCE_ROWS_KEY];
      const forensicRaw = input[KEYWORD_INTELLIGENCE_FORENSIC_TRACE_KEY];
      if (typeof manualSeedsRaw === "string") setManualSeedsText(manualSeedsRaw);
      if (uploadRaw && typeof uploadRaw === "object" && !Array.isArray(uploadRaw)) {
        const parsedUpload = uploadRaw as {
          files?: KeywordIntelligenceUploadedFile[];
          parsed_rows_count?: number;
          uploaded_at_iso?: string | null;
        };
        setUploadState({
          files: parsedUpload.files ?? [],
          parsed_rows_count: parsedUpload.parsed_rows_count ?? 0,
          uploaded_at_iso: parsedUpload.uploaded_at_iso ?? null,
        });
        setUploadedFiles(parsedUpload.files ?? []);
      }
      if (Array.isArray(rowsRaw)) {
        const safeRows = rowsRaw
          .map((row) => {
            if (!row || typeof row !== "object" || Array.isArray(row)) return null;
            const item = row as { keyword?: unknown; source_row?: unknown };
            if (typeof item.keyword !== "string" || !item.keyword.trim()) return null;
            return {
              keyword: item.keyword.trim(),
              source_row: typeof item.source_row === "number" ? item.source_row : 0,
            };
          })
          .filter((row): row is { keyword: string; source_row: number } => Boolean(row));
        setHeliumRows(safeRows);
      }
      if (aiRaw && profileRaw && confirmedRaw && typeof aiRaw === "object" && typeof profileRaw === "object") {
        const confirmedPlan = normalizeConfirmedPlan(confirmedRaw as ConfirmedKeywordPlan);
        const aiObject = aiRaw as Record<string, unknown>;
        setAnalysis({
          product_intelligence_profile: profileRaw as KeywordIntelligenceResponse["product_intelligence_profile"],
          keyword_classifications: (aiObject.keyword_classifications as KeywordClassificationItem[]) ?? [],
          clarification_questions:
            (clarRaw as KeywordIntelligenceResponse["clarification_questions"]) ?? [],
          confirmed_keyword_plan: confirmedPlan,
          rules_applied: (input["keyword_intelligence_rules_applied"] as string) ?? confirmedPlan.rules_version ?? "keyword_intelligence_rules_v1",
          forensic_trace: (forensicRaw as KeywordIntelligenceResponse["forensic_trace"]) ?? null,
          analysis_run_id: (aiObject.analysis_run_id as string) ?? null,
          analysis_started_at: (aiObject.analysis_started_at as string) ?? null,
          analysis_finished_at: (aiObject.analysis_finished_at as string) ?? null,
          analysis_model_used: (aiObject.analysis_model_used as string) ?? null,
        });
        setAnalysisSource("saved");
        setConfirmPlanByUser(Boolean(confirmedPlan.confirmed_by_user));
      }
      if (savedMetaRaw && typeof savedMetaRaw === "object" && !Array.isArray(savedMetaRaw)) {
        const meta = savedMetaRaw as {
          input_fingerprint?: string;
          analysis_run_id?: string | null;
          analysis_started_at?: string | null;
          analysis_finished_at?: string | null;
          analysis_model_used?: string | null;
          rows_count?: number;
          rules_version?: string | null;
          files_summary?: string | null;
        };
        setSavedFingerprint(meta.input_fingerprint ?? null);
        setLastRunMeta({
          analysis_run_id: meta.analysis_run_id ?? null,
          analysis_started_at: meta.analysis_started_at ?? null,
          analysis_finished_at: meta.analysis_finished_at ?? null,
          analysis_model_used: meta.analysis_model_used ?? null,
          rows_count: typeof meta.rows_count === "number" ? meta.rows_count : 0,
          rules_version: meta.rules_version ?? null,
          files_summary: meta.files_summary ?? null,
        });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [workItemId]);

  const manualSeeds = useMemo(() => splitLines(manualSeedsText), [manualSeedsText]);
  const hasUploadedFile = uploadState.files.length > 0;
  const uploadTimestamp = uploadState.uploaded_at_iso ? new Date(uploadState.uploaded_at_iso).toLocaleString("it-IT") : null;
  const currentFingerprint = useMemo(
    () =>
      buildFingerprint({
        manualSeeds,
        uploadState,
        clarifications: clarificationAnswers,
        pipeline: {
          threeLayerEnabled,
          contextBuilderEnabled,
          deterministicVetoEnabled,
          refinementEnabled,
        },
      }),
    [
      manualSeeds,
      uploadState,
      clarificationAnswers,
      threeLayerEnabled,
      contextBuilderEnabled,
      deterministicVetoEnabled,
      refinementEnabled,
    ],
  );

  async function onFilesSelected(files: File[]) {
    const nextFiles: KeywordIntelligenceUploadedFile[] = files.map((f) => ({
      filename: f.name,
      file_type: f.name.toLowerCase().endsWith(".csv") ? "csv" : f.name.toLowerCase().endsWith(".xlsx") ? "xlsx" : "unknown",
    }));
    const nextRuntimeMeta: UploadRuntimeMeta[] = files.map((f) => ({
      filename: f.name,
      file_type: f.name.toLowerCase().endsWith(".csv") ? "csv" : f.name.toLowerCase().endsWith(".xlsx") ? "xlsx" : "unknown",
      file_size_bytes: f.size,
    }));
    setUploadedFiles(nextFiles);
    setUploadRuntimeMeta(nextRuntimeMeta);

    const csvRows: { keyword: string; source_row: number }[] = [];
    for (const file of files) {
      if (file.name.toLowerCase().endsWith(".csv")) {
        const parsed = await parseCsvKeywords(file);
        csvRows.push(...parsed);
      }
    }
    setHeliumRows(csvRows);
    setUploadState({
      files: nextFiles,
      parsed_rows_count: csvRows.length,
      uploaded_at_iso: new Date().toISOString(),
    });
  }

  function onReplaceFile() {
    setUploadState({ files: [], parsed_rows_count: 0, uploaded_at_iso: null });
  }

  function onRemoveFile() {
    setUploadedFiles([]);
    setHeliumRows([]);
    setUploadRuntimeMeta([]);
    setUploadState({ files: [], parsed_rows_count: 0, uploaded_at_iso: null });
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
      include_forensic_trace: forensicDebugEnabled,
      pipeline_mode: threeLayerEnabled ? "three_layer" : "legacy",
      enable_ai_context_builder: contextBuilderEnabled,
      enable_deterministic_veto: deterministicVetoEnabled,
      enable_ai_refinement: refinementEnabled,
      forensic_fingerprint: currentFingerprint,
      forensic_input_meta: {
        file_ingestion: {
          parsing_outcome: uploadedFiles.length ? "success" : "rows_preparsed_or_manual_only",
          rows_parsed: heliumRows.length,
          normalized_columns: ["keyword", "source_row"],
          sample_keywords: heliumRows.slice(0, 8).map((row) => row.keyword),
          files: uploadRuntimeMeta.length
            ? uploadRuntimeMeta
            : uploadState.files.map((file) => ({
                filename: file.filename,
                file_type: file.file_type,
                file_size_bytes: null,
              })),
        },
        saved_fingerprint: savedFingerprint,
      },
    });
    setBusy(false);
    if (!response.ok) {
      setError(response.error?.message_it ?? it.workflowErrors.UNKNOWN);
      return;
    }
    const normalizedPlan = normalizeConfirmedPlan(response.intelligence.confirmed_keyword_plan);
    setAnalysis({ ...response.intelligence, confirmed_keyword_plan: normalizedPlan });
    setAnalysisSource("fresh");
    setConfirmPlanByUser(Boolean(normalizedPlan.confirmed_by_user));
    setLastRunMeta({
      analysis_run_id: response.intelligence.analysis_run_id ?? null,
      analysis_started_at: response.intelligence.analysis_started_at ?? null,
      analysis_finished_at: response.intelligence.analysis_finished_at ?? null,
      analysis_model_used: response.intelligence.analysis_model_used ?? null,
      rows_count: heliumRows.length,
      rules_version: response.intelligence.rules_applied ?? normalizedPlan.rules_version ?? null,
      files_summary: uploadedFiles.map((f) => f.filename).join(", ") || null,
    });
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
      [KEYWORD_CLARIFICATIONS_KEY]: analysis.clarification_questions,
      [CONFIRMED_KEYWORD_PLAN_KEY]: { ...analysis.confirmed_keyword_plan, confirmed_by_user: confirmPlanByUser },
      keyword_intelligence_rules_applied: analysis.rules_applied ?? analysis.confirmed_keyword_plan.rules_version,
      [KEYWORD_INTELLIGENCE_CONTEXT_KEY]: analysis.keyword_context ?? null,
      [KEYWORD_INTELLIGENCE_VETO_SUMMARY_KEY]: analysis.veto_summary ?? null,
      [KEYWORD_INTELLIGENCE_PIPELINE_VERSION_KEY]: analysis.pipeline_applied ?? "legacy",
      keyword_intelligence_meta: {
        input_fingerprint: currentFingerprint,
        analysis_source: analysisSource,
        computed_at_iso: new Date().toISOString(),
        analysis_run_id: analysis?.analysis_run_id ?? lastRunMeta?.analysis_run_id ?? null,
        analysis_started_at: analysis?.analysis_started_at ?? lastRunMeta?.analysis_started_at ?? null,
        analysis_finished_at: analysis?.analysis_finished_at ?? lastRunMeta?.analysis_finished_at ?? null,
        analysis_model_used: analysis?.analysis_model_used ?? lastRunMeta?.analysis_model_used ?? null,
        rows_count: heliumRows.length,
        rules_version: analysis.rules_applied ?? analysis.confirmed_keyword_plan.rules_version,
        files_summary: uploadedFiles.map((f) => f.filename).join(", ") || null,
      },
      [KEYWORD_INTELLIGENCE_UPLOAD_STATE_KEY]: uploadState,
      [KEYWORD_INTELLIGENCE_MANUAL_SEEDS_TEXT_KEY]: manualSeedsText,
      [KEYWORD_INTELLIGENCE_ROWS_KEY]: heliumRows,
      [KEYWORD_INTELLIGENCE_FORENSIC_TRACE_KEY]: analysis.forensic_trace ?? null,
      [KEYWORD_INTELLIGENCE_KEY]: {
        keyword_classifications: analysis.keyword_classifications,
        analysis_run_id: analysis.analysis_run_id ?? null,
        analysis_started_at: analysis.analysis_started_at ?? null,
        analysis_finished_at: analysis.analysis_finished_at ?? null,
        analysis_model_used: analysis.analysis_model_used ?? null,
      },
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
          {!hasUploadedFile ? (
            <div className="mt-2">
              <UploadDropzone
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onFilesSelected={(files) => void onFilesSelected(files)}
              />
            </div>
          ) : (
            <div className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-900">{k.uploadLoaded.title}</p>
              <p className="mt-1 text-xs text-emerald-800">
                {k.uploadLoaded.fileLabel}: {uploadState.files.map((file) => file.filename).join(", ")}
              </p>
              <p className="mt-1 text-xs text-emerald-800">
                {k.uploadLoaded.statusLabel}: {k.uploadLoaded.statusValue}
              </p>
              <p className="mt-1 text-xs text-emerald-800">
                {k.uploadLoaded.rowsLabel}: {uploadState.parsed_rows_count}
              </p>
              {uploadTimestamp ? (
                <p className="mt-1 text-xs text-emerald-800">
                  {k.uploadLoaded.timestampLabel}: {uploadTimestamp}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={onReplaceFile}>
                  {k.uploadLoaded.replace}
                </Button>
                <Button type="button" variant="ghost" onClick={onRemoveFile}>
                  {k.uploadLoaded.remove}
                </Button>
              </div>
            </div>
          )}
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
        {hasUploadedFile && heliumRows.length === 0 ? (
          <p className="text-xs text-amber-700">
            File caricato senza righe keyword reidratate: esegui Sostituisci file per forzare parsing fresco ed evitare analisi stale.
          </p>
        ) : null}
      </section>

      {analysis ? (
        <>
          <section className="surface-card rounded-4xl p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">Ultima analisi</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Run ID</p>
                <p className="mt-2 text-sm font-medium text-slate-900 break-all">{lastRunMeta?.analysis_run_id ?? analysis.analysis_run_id ?? "-"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Timeline</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {(lastRunMeta?.analysis_started_at ?? analysis.analysis_started_at) || "-"} {" -> "} {(lastRunMeta?.analysis_finished_at ?? analysis.analysis_finished_at) || "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Input</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  Righe: {lastRunMeta?.rows_count ?? heliumRows.length} · File: {lastRunMeta?.files_summary || uploadState.files.map((f) => f.filename).join(", ") || "-"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Motore</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  Model: {lastRunMeta?.analysis_model_used ?? analysis.analysis_model_used ?? "-"} · Rules: {lastRunMeta?.rules_version ?? analysis.rules_applied}
                </p>
              </div>
            </div>
          </section>
          <section className="surface-card rounded-4xl p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900">{k.interpretation.summaryTitle}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{k.interpretation.productDetected}</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {analysis.product_intelligence_profile.product_detected || k.interpretation.empty}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{k.interpretation.categoryDetected}</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {analysis.product_intelligence_profile.category_detected || k.interpretation.empty}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{k.interpretation.confidence}</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {Math.round(Math.max(0, Math.min(1, analysis.product_intelligence_profile.confidence_score)) * 100)}%
                </p>
              </div>
            </div>
          </section>
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
          <section className="surface-card rounded-4xl p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails((value) => !value)}
              className="text-xs font-semibold uppercase tracking-wide text-slate-600"
            >
              {showTechnicalDetails ? k.debugHide : k.debugShow}
            </button>
            {showTechnicalDetails ? (
              <div className="mt-4 space-y-4">
                <ProductInterpretationCard profile={analysis.product_intelligence_profile} compact={false} />
                {aiDebugEnabled ? <DebugTraceCollapsible trace={analysis.debug_trace ?? null} /> : null}
                {forensicDebugEnabled ? (
                  <ForensicKeywordTracePanel
                    trace={analysis.forensic_trace ?? null}
                    analysisSource={analysisSource}
                    currentFingerprint={currentFingerprint}
                    savedFingerprint={savedFingerprint}
                  />
                ) : null}
              </div>
            ) : null}
          </section>
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
