"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MoveToProjectPopover } from "@/components/projects/move-to-project-popover";
import { FormField } from "@/components/workflow/form-field";
import { StepSection } from "@/components/workflow/step-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { it } from "@/lib/i18n/it";
import { useWorkItemDraft } from "@/lib/use-work-item-draft";
import { createFromSimilar, type SimilarField, type WorkflowErrorDetail } from "@/lib/workflows";

const p = it.createFromSimilar;
const errCatalog = it.workflowErrors as Record<string, string>;

function resolveWorkflowMessage(detail: WorkflowErrorDetail | null): string {
  if (!detail) return p.errors.unknownServer;
  return errCatalog[detail.error_code] ?? detail.message_it;
}

export default function CompetitorPage() {
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [brandGuidelines, setBrandGuidelines] = useState("");
  const [toneOfVoice, setToneOfVoice] = useState("");
  const [uniqueSellingPoints, setUniqueSellingPoints] = useState("");
  const [actualStrengths, setActualStrengths] = useState("");
  const [targetPriceLevel, setTargetPriceLevel] = useState("");
  const [constraintsToAvoid, setConstraintsToAvoid] = useState("");
  const [differences, setDifferences] = useState("");
  const [confirmationNotes, setConfirmationNotes] = useState("");
  const [prefilledFields, setPrefilledFields] = useState<SimilarField[]>([]);
  const [analysisMeta, setAnalysisMeta] = useState<{ normalizedUrl: string; parserUsed: string; warnings: string[] } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<"complete" | "partial" | "failed" | null>(null);
  const [allowContinue, setAllowContinue] = useState(true);
  const [aiErrorBanner, setAiErrorBanner] = useState<WorkflowErrorDetail | null>(null);
  const [partialDismissed, setPartialDismissed] = useState(false);

  const fallbackTitle = useMemo(() => p.title, []);
  const draft = useWorkItemDraft({ workflowType: "competitor_analysis", fallbackTitle });
  const { isReady, load, save, workItemId } = draft;

  useEffect(() => {
    let cancelled = false;
    async function preload() {
      if (!isReady) return;
      const item = await load();
      if (!item || cancelled) return;
      const input = item.input_data as Record<string, unknown>;
      setCompetitorUrl(item.competitor_url || "");
      setBrandGuidelines((input.brand_guidelines as string) || "");
      setToneOfVoice((input.tone_of_voice as string) || "");
      setUniqueSellingPoints((input.unique_selling_points as string) || "");
      setActualStrengths((input.actual_product_strengths as string) || "");
      setTargetPriceLevel((input.target_price_level as string) || "");
      setConstraintsToAvoid((input.claims_or_constraints_to_avoid as string) || "");
      setDifferences((input.real_differences_vs_competitor as string) || "");
      setConfirmationNotes((input.confirmation_notes as string) || "");
    }
    void preload();
    return () => {
      cancelled = true;
    };
  }, [isReady, load]);

  async function persistDraft(status: "draft" | "in_progress" | "completed" = "draft") {
    await save({
      title: differences ? `Bozza da simile: ${differences.slice(0, 40)}` : p.title,
      summary: uniqueSellingPoints || "Bozza guidata da prodotto simile",
      competitorUrl,
      inputData: {
        brand_guidelines: brandGuidelines,
        tone_of_voice: toneOfVoice,
        unique_selling_points: uniqueSellingPoints,
        actual_product_strengths: actualStrengths,
        target_price_level: targetPriceLevel,
        claims_or_constraints_to_avoid: constraintsToAvoid,
        real_differences_vs_competitor: differences,
        confirmation_notes: confirmationNotes,
      },
      keywordData: {},
      generatedOutput: {},
      status,
    });
    setLastSavedAt(new Date().toLocaleTimeString("it-IT"));
  }

  async function analyzeAndPrefill() {
    if (!competitorUrl || !isReady) return;
    setErrorText(null);
    setAiErrorBanner(null);
    setPartialDismissed(false);
    setIsAnalyzing(true);
    const result = await createFromSimilar({
      competitor_url: competitorUrl,
      work_item_id: workItemId,
      user_required: {
        real_differences_vs_competitor: differences,
        brand_guidelines: brandGuidelines,
        tone_of_voice: toneOfVoice,
        unique_selling_points: uniqueSellingPoints,
        actual_product_strengths: actualStrengths,
        target_price_level: targetPriceLevel,
        claims_or_constraints_to_avoid: constraintsToAvoid,
      },
      user_confirmation: {
        confirmation_notes: confirmationNotes,
      },
    });
    setIsAnalyzing(false);
    if (!result.ok) {
      setExtractionStatus(null);
      setAllowContinue(true);
      setErrorText(result.error ? resolveWorkflowMessage(result.error) : p.errors.generic);
      return;
    }
    const response = result.data;
    setPrefilledFields(response.fields);
    setAnalysisMeta({
      normalizedUrl: response.normalized_url,
      parserUsed: response.parser_used,
      warnings: response.warnings,
    });
    setExtractionStatus(response.extraction_status);
    setAllowContinue(response.allow_continue);
    setAiErrorBanner(response.ai_error);
    setLastSavedAt(new Date().toLocaleTimeString("it-IT"));
  }

  const autoExtracted = prefilledFields.filter((f) => f.field_class === "auto_extracted");
  const aiSuggested = prefilledFields.filter((f) => f.field_class === "ai_suggested");

  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{p.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{p.subtitle}</p>
      </header>

      <StepSection
        step={1}
        title="Prodotto simile da analizzare"
        description="Incolla un URL Amazon simile al tuo prodotto. Useremo questa base per precompilare la strategia."
        intro="Questo passaggio riduce l'effetto pagina bianca: partiamo da dati reali gia' pubblici."
      >
        <FormField
          required
          label="URL Amazon del prodotto simile"
          hint="Inserisci un link completo, ad esempio con /dp/."
          example="https://www.amazon.it/dp/B08N5WRWNW"
        >
          <Input
            placeholder="https://www.amazon.it/dp/..."
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
          />
        </FormField>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button type="button" onClick={() => void analyzeAndPrefill()} disabled={!isReady || isAnalyzing || !competitorUrl}>
            {isAnalyzing ? "Analisi in corso..." : p.actions.analyze}
          </Button>
          <Button type="button" variant="ghost" onClick={() => void analyzeAndPrefill()} disabled={!isReady || isAnalyzing || !competitorUrl}>
            {p.actions.regenerate}
          </Button>
        </div>
        {errorText ? <p className="mt-2 text-sm text-rose-600">{errorText}</p> : null}
        {!allowContinue && extractionStatus ? (
          <p className="mt-2 text-sm text-rose-700">
            Non è possibile proseguire automaticamente con questa analisi. Correggi l&apos;URL o riprova più tardi.
          </p>
        ) : null}
        {extractionStatus === "partial" && !partialDismissed ? (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            <p>{p.hints.partialExtraction}</p>
            <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={() => setPartialDismissed(true)}>
              {p.hints.dismissWarning}
            </Button>
          </div>
        ) : null}
        {aiErrorBanner ? (
          <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50/90 px-4 py-3 text-sm text-orange-950">
            <p className="font-medium">{p.hints.aiSoftFailure}</p>
            <p className="mt-1 text-orange-900/90">{resolveWorkflowMessage(aiErrorBanner)}</p>
          </div>
        ) : null}
        {analysisMeta ? (
          <p className="mt-2 text-xs text-slate-500">
            URL normalizzato: {analysisMeta.normalizedUrl} • parser: {analysisMeta.parserUsed}
          </p>
        ) : null}
      </StepSection>

      <StepSection
        step={2}
        title="Bozza precompilata dal sistema"
        description="Questi campi arrivano dall'analisi automatica del prodotto simile."
        intro="Modifica liberamente: i dati estratti sono una base di partenza, non la versione finale."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {autoExtracted.length === 0 ? (
            <p className="text-sm text-slate-600">Esegui prima l&apos;analisi URL per vedere i campi precompilati.</p>
          ) : null}
          {autoExtracted.map((field) => (
            <Card key={field.key} className="border-slate-200/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{field.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700">
                  {Array.isArray(field.value) ? field.value.join(" • ") : String(field.value ?? "n/d")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </StepSection>

      <StepSection
        step={3}
        title="Differenze e strategia del tuo brand (obbligatorio)"
        description="Qui inserisci i dati che il sistema non puo' dedurre con certezza."
        intro="Questo e' il cuore del valore: cosa ti rende migliore o diverso rispetto al prodotto simile."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField required label="Differenze reali vs competitor">
            <Textarea value={differences} onChange={(e) => setDifferences(e.target.value)} rows={4} />
          </FormField>
          <FormField required label="Unique selling points">
            <Textarea value={uniqueSellingPoints} onChange={(e) => setUniqueSellingPoints(e.target.value)} rows={4} />
          </FormField>
          <FormField required label="Punti di forza reali del tuo prodotto">
            <Textarea value={actualStrengths} onChange={(e) => setActualStrengths(e.target.value)} rows={4} />
          </FormField>
          <FormField required label="Linee guida brand e tone of voice">
            <Textarea
              value={brandGuidelines}
              onChange={(e) => setBrandGuidelines(e.target.value)}
              rows={4}
              placeholder="Brand guidelines..."
            />
            <Input
              className="mt-2"
              value={toneOfVoice}
              onChange={(e) => setToneOfVoice(e.target.value)}
              placeholder="Tono desiderato (es. professionale ma accessibile)"
            />
          </FormField>
          <FormField required label="Fascia prezzo target">
            <Input value={targetPriceLevel} onChange={(e) => setTargetPriceLevel(e.target.value)} placeholder="entry | mid | premium" />
          </FormField>
          <FormField required label="Claim o vincoli da evitare">
            <Textarea value={constraintsToAvoid} onChange={(e) => setConstraintsToAvoid(e.target.value)} rows={4} />
          </FormField>
        </div>
      </StepSection>

      <StepSection
        step={4}
        title="Conferma campi incerti prima di generare"
        description="Rivedi suggerimenti e note: conferma cio' che vuoi mantenere."
        intro="Per utenti non esperti, questa revisione evita errori comuni su target, posizionamento e messaggio."
      >
        <div className="space-y-4">
          {aiSuggested.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {aiSuggested.map((field) => (
                <Card key={field.key} className="border-slate-200/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{field.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700">
                      {Array.isArray(field.value) ? field.value.join(" • ") : String(field.value ?? "n/d")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">I suggerimenti compariranno dopo l&apos;analisi URL.</p>
          )}
          <FormField
            required
            label="Note di conferma finale"
            hint="Scrivi cosa confermi, cosa modifichi e cosa rifiuti prima della generazione."
          >
            <Textarea
              value={confirmationNotes}
              onChange={(e) => setConfirmationNotes(e.target.value)}
              rows={5}
              placeholder="Confermo target..., modifico angolo messaggio..., evito claim..."
            />
          </FormField>
          {analysisMeta?.warnings?.length ? (
            <p className="text-xs text-amber-700">Avvisi analisi: {analysisMeta.warnings.join(" • ")}</p>
          ) : null}
        </div>
      </StepSection>

      <div className="space-y-2 pb-6">
        {lastSavedAt ? <p className="text-xs text-slate-500">Salvato alle {lastSavedAt}</p> : null}
      </div>

      <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:flex-wrap sm:justify-end sm:items-center">
        <Button variant="ghost" type="button" onClick={() => void persistDraft("draft")} disabled={!isReady}>
          {it.common.saveDraft}
        </Button>
        {workItemId ? <MoveToProjectPopover workItemId={workItemId} compact /> : null}
        {workItemId ? (
          <Button type="button" variant="secondary" asChild>
            <Link href={`/listing-generazione?workItemId=${workItemId}`}>{it.listingGeneration.fromCompetitorCta}</Link>
          </Button>
        ) : null}
        <Button type="button" onClick={() => void persistDraft("in_progress")} disabled={!isReady}>
          {p.actions.continue}
        </Button>
      </div>
    </main>
  );
}
