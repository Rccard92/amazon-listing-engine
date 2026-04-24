"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { it } from "@/lib/i18n/it";
import {
  KEYWORD_PLANNING_KEY,
  requestKeywordPlanningForWorkItem,
  type KeywordPlanning,
} from "@/lib/listing-generation";
import { getWorkItemResult, updateWorkItemResult } from "@/lib/work-items";

const p = it.keywordPlanning;

function emptyPlanning(): KeywordPlanning {
  return {
    keyword_primaria_finale: "",
    keyword_secondarie_prioritarie: [],
    cluster_semantici: [],
    parole_da_spingere_nel_frontend: [],
    parole_da_tenere_per_backend: [],
    note_su_keyword_da_non_forzare: [],
  };
}

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function KeywordPlanningInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workItemId = searchParams.get("workItemId");

  const [planning, setPlanning] = useState<KeywordPlanning>(() => emptyPlanning());
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!workItemId) {
        setError("Parametro workItemId mancante.");
        return;
      }
      const loaded = await getWorkItemResult(workItemId);
      if (cancelled) return;
      if (!loaded.ok) {
        setError(`Impossibile caricare work item (${loaded.status}): ${loaded.error.message}`);
        return;
      }
      const raw = (loaded.data.input_data as Record<string, unknown>)[KEYWORD_PLANNING_KEY];
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        setPlanning({ ...emptyPlanning(), ...(raw as KeywordPlanning) });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [workItemId]);

  async function suggestWithAi() {
    if (!workItemId) return;
    setBusy(true);
    setError(null);
    const res = await requestKeywordPlanningForWorkItem(workItemId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error?.message_it ?? it.workflowErrors.UNKNOWN);
      return;
    }
    setPlanning(res.planning);
  }

  async function save(nextRouteToGenerate: boolean) {
    if (!workItemId) return;
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
      [KEYWORD_PLANNING_KEY]: planning,
    };
    const updated = await updateWorkItemResult(workItemId, { input_data: nextInput, status: "in_progress" });
    setBusy(false);
    if (!updated.ok) {
      setError(`Salvataggio keyword planning fallito (${updated.status}): ${updated.error.message}`);
      return;
    }
    setHint(p.saved);
    if (nextRouteToGenerate) {
      router.push(`/listing-generazione?workItemId=${workItemId}`);
    }
  }

  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{p.badge}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{p.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{p.subtitle}</p>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </header>

      <section className="surface-card rounded-4xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => void suggestWithAi()} disabled={busy}>
            {busy ? it.common.loading : p.suggest}
          </Button>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-800">{p.fields.primary}</label>
          <Textarea
            rows={2}
            className="mt-1"
            value={planning.keyword_primaria_finale}
            onChange={(e) => setPlanning((x) => ({ ...x, keyword_primaria_finale: e.target.value.trim() }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-800">{p.fields.secondary}</label>
          <Textarea
            rows={4}
            className="mt-1"
            value={planning.keyword_secondarie_prioritarie.join("\n")}
            onChange={(e) => setPlanning((x) => ({ ...x, keyword_secondarie_prioritarie: splitLines(e.target.value) }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-800">{p.fields.frontendPush}</label>
          <Textarea
            rows={4}
            className="mt-1"
            value={planning.parole_da_spingere_nel_frontend.join("\n")}
            onChange={(e) => setPlanning((x) => ({ ...x, parole_da_spingere_nel_frontend: splitLines(e.target.value) }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-800">{p.fields.backendKeep}</label>
          <Textarea
            rows={4}
            className="mt-1"
            value={planning.parole_da_tenere_per_backend.join("\n")}
            onChange={(e) => setPlanning((x) => ({ ...x, parole_da_tenere_per_backend: splitLines(e.target.value) }))}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-800">{p.fields.notes}</label>
          <Textarea
            rows={3}
            className="mt-1"
            value={planning.note_su_keyword_da_non_forzare.join("\n")}
            onChange={(e) =>
              setPlanning((x) => ({ ...x, note_su_keyword_da_non_forzare: splitLines(e.target.value) }))
            }
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void save(false)}>
            {p.save}
          </Button>
          <Button type="button" disabled={busy} onClick={() => void save(true)}>
            {p.goGenerate}
          </Button>
        </div>
      </section>
    </main>
  );
}

export default function KeywordPlanningPage() {
  return (
    <Suspense
      fallback={
        <main className="p-8">
          <p className="text-sm text-slate-600">{it.common.loading}</p>
        </main>
      }
    >
      <KeywordPlanningInner />
    </Suspense>
  );
}
