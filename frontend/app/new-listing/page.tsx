"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { MoveToProjectPopover } from "@/components/projects/move-to-project-popover";
import { FormField } from "@/components/workflow/form-field";
import { StepSection } from "@/components/workflow/step-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadDropzone } from "@/components/ui/upload-dropzone";
import { it } from "@/lib/i18n/it";
import {
  DEFAULT_BRAND,
  emptyProductBrief,
  migrateLegacyManualToBriefAndEnrichment,
  PRODUCT_BRIEF_KEY,
  STRATEGIC_ENRICHMENT_KEY,
  type PriceTier,
  type ProductBrief,
} from "@/lib/listing-generation";
import { useWorkItemDraft } from "@/lib/use-work-item-draft";
import { getWorkItemResult } from "@/lib/work-items";

const p = it.newListing;
const b = p.brief;
const tierOptions: { value: PriceTier; label: string }[] = [
  { value: "unknown", label: "Non specificato" },
  { value: "entry", label: "Entry / accessibile" },
  { value: "mid", label: "Mid-range" },
  { value: "premium", label: "Premium" },
];

function splitKeywords(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function PhaseStrip() {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-slate-100/90 p-2 text-xs font-medium text-slate-600">
      <span className="rounded-xl bg-white px-3 py-1.5 text-slate-900 shadow-sm">{p.phases.data}</span>
      <span className="text-slate-400">→</span>
      <span className="rounded-xl px-3 py-1.5">{p.phases.enrich}</span>
      <span className="text-slate-400">→</span>
      <span className="rounded-xl px-3 py-1.5">{p.phases.keywordPlan}</span>
      <span className="text-slate-400">→</span>
      <span className="rounded-xl px-3 py-1.5">{p.phases.generate}</span>
    </div>
  );
}

function NewListingPageInner() {
  const router = useRouter();
  const [brief, setBrief] = useState<ProductBrief>(() => emptyProductBrief());
  const [kwPrimaryText, setKwPrimaryText] = useState("");
  const [kwSecondaryText, setKwSecondaryText] = useState("");
  const [caratteristicheText, setCaratteristicheText] = useState("");
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const draft = useWorkItemDraft({
    workflowType: "new_listing",
    fallbackTitle: p.title,
    basePath: "/new-listing",
  });
  const { isReady, load, save, workItemId, draftError } = draft;

  useEffect(() => {
    let cancelled = false;
    async function preload() {
      if (!isReady) return;
      const loaded = await load();
      if (!loaded || cancelled) return;
      if (!loaded.ok) {
        setActionError(`Impossibile caricare la bozza (${loaded.status}): ${loaded.error.message}`);
        return;
      }
      const item = loaded.data;
      const input = item.input_data as Record<string, unknown>;
      const keyword = item.keyword_data as Record<string, unknown>;
      const pbRaw = input[PRODUCT_BRIEF_KEY];
      if (pbRaw && typeof pbRaw === "object" && !Array.isArray(pbRaw)) {
        const pb = pbRaw as ProductBrief;
        setBrief({
          ...emptyProductBrief(),
          ...pb,
          brand: (pb.brand || DEFAULT_BRAND).trim() || DEFAULT_BRAND,
          bullet_attuali: Array.isArray(pb.bullet_attuali) ? [...pb.bullet_attuali] : [],
          caratteristiche_specifiche: Array.isArray(pb.caratteristiche_specifiche)
            ? [...pb.caratteristiche_specifiche]
            : [],
          keyword_primarie: Array.isArray(pb.keyword_primarie) ? [...pb.keyword_primarie] : [],
          keyword_secondarie: Array.isArray(pb.keyword_secondarie) ? [...pb.keyword_secondarie] : [],
        });
        setKwPrimaryText((pb.keyword_primarie || []).join(", "));
        setKwSecondaryText((pb.keyword_secondarie || []).join(", "));
        setCaratteristicheText((pb.caratteristiche_specifiche || []).join("\n"));
      } else {
        const mig = migrateLegacyManualToBriefAndEnrichment(input);
        if (mig) {
          setBrief(mig.brief);
          setKwPrimaryText(mig.brief.keyword_primarie.join(", "));
          setKwSecondaryText(mig.brief.keyword_secondarie.join(", "));
          setCaratteristicheText(mig.brief.caratteristiche_specifiche.join("\n"));
        } else {
          setBrief({
            ...emptyProductBrief(),
            nome_prodotto: String(input.product_name || ""),
            categoria: input.category ? String(input.category) : null,
            brand: DEFAULT_BRAND,
          });
          setKwPrimaryText(String((keyword.manual_keywords as string) || ""));
          setKwSecondaryText("");
          setCaratteristicheText("");
        }
      }
      setUploadedFileNames((keyword.uploaded_files as string[]) || []);
    }
    void preload();
    return () => {
      cancelled = true;
    };
  }, [isReady, load, workItemId]);

  const briefForSave = useMemo((): ProductBrief => {
    const lines = caratteristicheText
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      ...brief,
      caratteristiche_specifiche: lines,
      keyword_primarie: splitKeywords(kwPrimaryText),
      keyword_secondarie: splitKeywords(kwSecondaryText),
    };
  }, [brief, caratteristicheText, kwPrimaryText, kwSecondaryText]);

  async function persist(status: "draft" | "in_progress" | "completed" = "draft") {
    const bSave = briefForSave;
    const summary =
      [bSave.nome_prodotto, bSave.categoria].filter(Boolean).join(" • ") || "Bozza nuova scheda prodotto";
    if (!workItemId) {
      setActionError("Work item non disponibile. Attendi la creazione della bozza e riprova.");
      return null;
    }
    const current = await getWorkItemResult(workItemId);
    if (!current.ok) {
      setActionError(`Impossibile leggere il work item (${current.status}): ${current.error.message}`);
      return null;
    }
    const item = current.data;
    const prev = item.input_data as Record<string, unknown> | undefined;
    const enrichment = prev?.[STRATEGIC_ENRICHMENT_KEY];
    const existingOutput = (item.generated_output as Record<string, unknown> | undefined) ?? {};
    const saved = await save({
      title: bSave.nome_prodotto || p.title,
      summary,
      inputData: {
        ...(prev && typeof prev === "object" ? prev : {}),
        product_name: bSave.nome_prodotto,
        category: bSave.categoria ?? "",
        [PRODUCT_BRIEF_KEY]: bSave,
        ...(enrichment !== undefined ? { [STRATEGIC_ENRICHMENT_KEY]: enrichment } : {}),
      },
      keywordData: {
        manual_keywords: [kwPrimaryText, kwSecondaryText].filter(Boolean).join("\n"),
        uploaded_files: uploadedFileNames,
      },
      generatedOutput: existingOutput,
      status,
    });
    if (!saved?.ok) {
      setActionError(`Salvataggio non riuscito (${saved?.status ?? "?"}): ${saved?.error.message ?? "errore sconosciuto"}`);
      return null;
    }
    const input = saved.data.input_data as Record<string, unknown>;
    if (!input[PRODUCT_BRIEF_KEY] || typeof input[PRODUCT_BRIEF_KEY] !== "object" || Array.isArray(input[PRODUCT_BRIEF_KEY])) {
      setActionError("Salvataggio incompleto: product_brief non presente nel work item.");
      return null;
    }
    setActionError(null);
    setLastSavedAt(new Date().toLocaleTimeString("it-IT"));
    return saved.data;
  }

  async function handleContinue() {
    if (!briefForSave.nome_prodotto.trim()) {
      return;
    }
    const saved = await persist("in_progress");
    if (!saved || !workItemId) return;
    router.push(`/arricchimento-strategico?workItemId=${workItemId}`);
  }

  function setBullet(i: number, value: string) {
    setBrief((prev) => {
      const next = [...prev.bullet_attuali];
      next[i] = value;
      return { ...prev, bullet_attuali: next };
    });
  }

  function addBullet() {
    setBrief((prev) => ({ ...prev, bullet_attuali: [...prev.bullet_attuali, ""] }));
  }

  function removeBullet(i: number) {
    setBrief((prev) => ({
      ...prev,
      bullet_attuali: prev.bullet_attuali.filter((_, j) => j !== i),
    }));
  }

  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{p.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{p.subtitle}</p>
        <div className="mt-6 space-y-2">
          <PhaseStrip />
          <p className="text-xs text-slate-500">{p.phases.phase1Active}</p>
        </div>
      </header>

      <StepSection
        step={1}
        title={b.identityTitle}
        description={b.identityIntro}
        intro=""
        sectionHelp={{ title: p.steps.product.sectionHelp.title, body: p.steps.product.sectionHelp.body }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            required
            label={p.steps.product.fields.name.label}
            hint={p.steps.product.fields.name.hint}
            example={p.steps.product.fields.name.example}
            help={p.steps.product.fields.name.help}
          >
            <Input
              placeholder={p.steps.product.fields.name.example}
              value={brief.nome_prodotto}
              onChange={(e) => setBrief({ ...brief, nome_prodotto: e.target.value })}
            />
          </FormField>
          <FormField
            optional
            label={p.steps.product.fields.category.label}
            hint={p.steps.product.fields.category.hint}
            example={p.steps.product.fields.category.example}
            help={p.steps.product.fields.category.help}
          >
            <Input
              placeholder={p.steps.product.fields.category.example}
              value={brief.categoria ?? ""}
              onChange={(e) => setBrief({ ...brief, categoria: e.target.value || null })}
            />
          </FormField>
          <FormField label={b.brand.label} hint={b.brand.hint}>
            <Input
              value={brief.brand}
              onChange={(e) => setBrief({ ...brief, brand: e.target.value || DEFAULT_BRAND })}
            />
          </FormField>
          <FormField label={b.priceTier.label}>
            <select
              className="h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              value={brief.livello_prezzo}
              onChange={(e) => setBrief({ ...brief, livello_prezzo: e.target.value as PriceTier })}
            >
              {tierOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </StepSection>

      <StepSection step={2} title={b.referenceTitle} description={b.referenceIntro} intro="" sectionHelp={undefined}>
        <div className="grid gap-4">
          <FormField label={b.descrizioneAttuale.label} hint={b.descrizioneAttuale.hint}>
            <Textarea
              rows={6}
              value={brief.descrizione_attuale ?? ""}
              onChange={(e) => setBrief({ ...brief, descrizione_attuale: e.target.value || null })}
              placeholder={b.descrizioneAttuale.hint}
            />
          </FormField>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-800">{b.bulletAttuali.label}</p>
            <p className="text-xs text-slate-500">{b.bulletAttuali.hint}</p>
            <div className="space-y-2">
              {brief.bullet_attuali.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={line} onChange={(e) => setBullet(i, e.target.value)} placeholder={`Bullet ${i + 1}`} />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeBullet(i)}>
                    {b.bulletAttuali.remove}
                  </Button>
                </div>
              ))}
              <Button type="button" variant="secondary" size="sm" onClick={addBullet}>
                {b.bulletAttuali.add}
              </Button>
            </div>
          </div>
        </div>
      </StepSection>

      <StepSection step={3} title={b.specsTitle} description={b.specsIntro} intro="" sectionHelp={undefined}>
        <div className="grid gap-4">
          <FormField label={b.caratteristiche.label} hint={b.caratteristiche.hint}>
            <Textarea
              rows={5}
              value={caratteristicheText}
              onChange={(e) => setCaratteristicheText(e.target.value)}
            />
          </FormField>
          <FormField label={b.dettagliArticolo.label} hint={b.dettagliArticolo.hint}>
            <Textarea
              rows={4}
              value={brief.dettagli_articolo ?? ""}
              onChange={(e) => setBrief({ ...brief, dettagli_articolo: e.target.value || null })}
            />
          </FormField>
          <FormField label={b.dettagliAggiuntivi.label} hint={b.dettagliAggiuntivi.hint}>
            <Textarea
              rows={3}
              value={brief.dettagli_aggiuntivi ?? ""}
              onChange={(e) => setBrief({ ...brief, dettagli_aggiuntivi: e.target.value || null })}
            />
          </FormField>
          <FormField label={b.riassuntoRecensioni.label} hint={b.riassuntoRecensioni.hint}>
            <Textarea
              rows={3}
              value={brief.riassunto_ai_recensioni ?? ""}
              onChange={(e) => setBrief({ ...brief, riassunto_ai_recensioni: e.target.value || null })}
            />
          </FormField>
        </div>
      </StepSection>

      <StepSection
        step={4}
        title={b.kwTitle}
        description={b.kwIntro}
        intro=""
        sectionHelp={p.steps.keywords.sectionHelp}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label={b.kwPrimary.label} hint={b.kwPrimary.hint}>
            <Textarea rows={4} value={kwPrimaryText} onChange={(e) => setKwPrimaryText(e.target.value)} />
          </FormField>
          <FormField label={b.kwSecondary.label} hint={b.kwSecondary.hint}>
            <Textarea rows={4} value={kwSecondaryText} onChange={(e) => setKwSecondaryText(e.target.value)} />
          </FormField>
        </div>
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-slate-800">{p.steps.keywords.tabs.csv}</p>
          <UploadDropzone
            title={p.dropzone.title}
            description={p.dropzone.description}
            emptyMessage={p.dropzone.empty}
            selectedHeading={p.dropzone.selectedHeading}
            footerHint={p.dropzone.hintLine}
            onFilesSelected={(files) => setUploadedFileNames(files.map((f) => f.name))}
          />
        </div>
      </StepSection>

      <div className="space-y-2 pb-6">
        {lastSavedAt ? <p className="text-xs text-slate-500">Salvato alle {lastSavedAt}</p> : null}
        {!isReady ? <p className="text-xs text-slate-500">Preparazione bozza in Cronologia...</p> : null}
        {draftError ? <p className="text-xs text-red-700">Errore creazione bozza: {draftError.message}</p> : null}
        {actionError ? <p className="text-xs text-red-700">{actionError}</p> : null}
        <p className="text-xs text-slate-500">{p.phases.afterSave}</p>
      </div>

      <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:flex-wrap sm:justify-end sm:items-center">
        <Button variant="ghost" type="button" onClick={() => void persist("draft")} disabled={!isReady}>
          {it.common.saveDraft}
        </Button>
        {workItemId ? <MoveToProjectPopover workItemId={workItemId} compact /> : null}
        <Button
          type="button"
          onClick={() => void handleContinue()}
          disabled={!isReady || !briefForSave.nome_prodotto.trim()}
        >
          {it.common.continue}
        </Button>
      </div>
    </main>
  );
}

export default function NewListingPage() {
  return (
    <Suspense
      fallback={
        <main className="p-8">
          <p className="text-sm text-slate-600">{it.common.loading}</p>
        </main>
      }
    >
      <NewListingPageInner />
    </Suspense>
  );
}
