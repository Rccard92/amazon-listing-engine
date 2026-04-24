"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { it } from "@/lib/i18n/it";
import {
  emptyStrategicEnrichment,
  PRODUCT_BRIEF_KEY,
  requestStrategicEnrichmentForWorkItem,
  STRATEGIC_ENRICHMENT_KEY,
  type StrategicEnrichment,
} from "@/lib/listing-generation";
import { getWorkItemResult, updateWorkItemResult } from "@/lib/work-items";

const m = it.manualWorkflow;

function EnrichmentInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workItemId = searchParams.get("workItemId");

  const [hasBrief, setHasBrief] = useState(false);
  const [enrichment, setEnrichment] = useState<StrategicEnrichment>(() => emptyStrategicEnrichment());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saveHint, setSaveHint] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!workItemId) {
        setLoadError("Parametro workItemId mancante.");
        return;
      }
      const loaded = await getWorkItemResult(workItemId);
      if (cancelled) return;
      if (!loaded.ok) {
        if (loaded.status === 404) {
          setLoadError("Work item non trovato (404). Torna alla Fase 1 e crea una nuova bozza.");
        } else if (loaded.status === 422) {
          setLoadError("ID work item non valido (422). Apri di nuovo la Fase 1 dalla dashboard.");
        } else {
          setLoadError(`Errore caricamento work item (${loaded.status}): ${loaded.error.message}`);
        }
        return;
      }
      const item = loaded.data;
      const input = item.input_data as Record<string, unknown>;
      const pbRaw = input[PRODUCT_BRIEF_KEY];
      if (!pbRaw || typeof pbRaw !== "object" || Array.isArray(pbRaw)) {
        setLoadError(m.missingBrief);
        setHasBrief(false);
        return;
      }
      setHasBrief(true);
      const enrRaw = input[STRATEGIC_ENRICHMENT_KEY];
      if (enrRaw && typeof enrRaw === "object" && !Array.isArray(enrRaw)) {
        setEnrichment({ ...emptyStrategicEnrichment(), ...(enrRaw as StrategicEnrichment) });
      } else {
        setEnrichment(emptyStrategicEnrichment());
      }
      setLoadError(null);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [workItemId]);

  async function runAi() {
    if (!workItemId) return;
    setAiBusy(true);
    setAiError(null);
    const res = await requestStrategicEnrichmentForWorkItem(workItemId);
    setAiBusy(false);
    if (!res.ok) {
      setAiError(res.error?.message_it ?? it.workflowErrors.UNKNOWN);
      return;
    }
    setEnrichment(res.enrichment);
  }

  async function saveEnrichment(nextStatus?: "draft" | "in_progress" | "completed") {
    if (!workItemId) return;
    setSaving(true);
    setSaveHint(null);
    const loaded = await getWorkItemResult(workItemId);
    if (!loaded.ok) {
      setAiError(`Impossibile salvare arricchimento (${loaded.status}): ${loaded.error.message}`);
      setSaving(false);
      return;
    }
    const item = loaded.data;
    const input = { ...(item.input_data as Record<string, unknown>), [STRATEGIC_ENRICHMENT_KEY]: enrichment };
    const updated = await updateWorkItemResult(workItemId, {
      input_data: input,
      ...(nextStatus ? { status: nextStatus } : {}),
    });
    if (!updated.ok) {
      setAiError(`Salvataggio arricchimento fallito (${updated.status}): ${updated.error.message}`);
      setSaving(false);
      return;
    }
    setSaving(false);
    setAiError(null);
    setSaveHint(m.savedEnrichment);
  }

  async function handleGoGenerate() {
    if (!workItemId) return;
    await saveEnrichment("in_progress");
    router.push(`/listing-generazione?workItemId=${workItemId}`);
  }

  function setBeneficiText(t: string) {
    const lines = t.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    setEnrichment((e) => ({ ...e, benefici_principali: lines }));
  }

  function setObiezioniText(t: string) {
    const lines = t.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    setEnrichment((e) => ({ ...e, gestione_obiezioni: lines }));
  }

  const beneficiText = enrichment.benefici_principali.join("\n");
  const obiezioniText = enrichment.gestione_obiezioni.join("\n");

  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
          <span className="rounded-xl px-3 py-1.5">{it.newListing.phases.data}</span>
          <span className="text-slate-400">→</span>
          <span className="rounded-xl bg-white px-3 py-1.5 text-slate-900 shadow-sm">{it.newListing.phases.enrich}</span>
          <span className="text-slate-400">→</span>
          <span className="rounded-xl px-3 py-1.5">{it.newListing.phases.generate}</span>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{m.enrichPageTitle}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{m.enrichPageSubtitle}</p>
        {loadError ? <p className="mt-3 text-sm text-amber-800">{loadError}</p> : null}
        {aiError ? <p className="mt-3 text-sm text-red-700">{aiError}</p> : null}
      </header>

      {hasBrief && workItemId ? (
        <>
          <section className="surface-card rounded-4xl p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="secondary" disabled={aiBusy} onClick={() => void runAi()}>
                {aiBusy ? it.common.loading : m.suggestAi}
              </Button>
              <p className="text-xs text-slate-500">{m.suggestAiHint}</p>
            </div>
            <p className="mt-2 text-xs text-slate-500">{m.enrichHelp}</p>

            <div className="mt-6 grid gap-4">
              <div>
                <label className="text-sm font-medium text-slate-800">{m.fields.benefici}</label>
                <Textarea
                  className="mt-1"
                  rows={5}
                  value={beneficiText}
                  onChange={(e) => setBeneficiText(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-800">{m.fields.usp}</label>
                <Input
                  className="mt-1"
                  value={enrichment.usp_differenziazione ?? ""}
                  onChange={(e) =>
                    setEnrichment((x) => ({ ...x, usp_differenziazione: e.target.value || null }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-800">{m.fields.target}</label>
                <Input
                  className="mt-1"
                  value={enrichment.target_cliente ?? ""}
                  onChange={(e) =>
                    setEnrichment((x) => ({ ...x, target_cliente: e.target.value || null }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-800">{m.fields.obiezioni}</label>
                <Textarea
                  className="mt-1"
                  rows={4}
                  value={obiezioniText}
                  onChange={(e) => setObiezioniText(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-800">{m.fields.emotivo}</label>
                <Textarea
                  className="mt-1"
                  rows={2}
                  value={enrichment.angolo_emotivo ?? ""}
                  onChange={(e) =>
                    setEnrichment((x) => ({ ...x, angolo_emotivo: e.target.value || null }))
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => void saveEnrichment()} disabled={saving}>
                {saving ? it.common.loading : m.saveEnrichment}
              </Button>
              {saveHint ? <span className="text-xs text-slate-500 sm:order-last sm:ml-2">{saveHint}</span> : null}
              <Button type="button" onClick={() => void handleGoGenerate()} disabled={saving}>
                {m.goGenerate}
              </Button>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}

export default function ArricchimentoStrategicoPage() {
  return (
    <Suspense
      fallback={
        <main className="p-8">
          <p className="text-sm text-slate-600">{it.common.loading}</p>
        </main>
      }
    >
      <EnrichmentInner />
    </Suspense>
  );
}
