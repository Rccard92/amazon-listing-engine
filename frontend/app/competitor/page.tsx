"use client";

import { useEffect, useMemo, useState } from "react";

import { MoveToProjectPopover } from "@/components/projects/move-to-project-popover";
import { EmptyState } from "@/components/workflow/empty-state";
import { FormField } from "@/components/workflow/form-field";
import { StepSection } from "@/components/workflow/step-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { it } from "@/lib/i18n/it";
import { useWorkItemDraft } from "@/lib/use-work-item-draft";

const p = it.competitor;

export default function CompetitorPage() {
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [audience, setAudience] = useState("");
  const [advantage, setAdvantage] = useState("");
  const [narrative, setNarrative] = useState("");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

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
      setAudience((input.audience as string) || "");
      setAdvantage((input.advantage as string) || "");
      setNarrative((input.narrative as string) || "");
    }
    void preload();
    return () => {
      cancelled = true;
    };
  }, [isReady, load]);

  async function persist(status: "draft" | "in_progress" | "completed" = "draft") {
    await save({
      title: audience ? `Analisi competitor: ${audience}` : p.title,
      summary: advantage || "Bozza analisi competitor",
      competitorUrl,
      inputData: { audience, advantage, narrative },
      keywordData: {},
      generatedOutput: {},
      status,
    });
    setLastSavedAt(new Date().toLocaleTimeString("it-IT"));
  }

  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{p.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{p.subtitle}</p>
      </header>

      <StepSection
        step={1}
        title={p.steps.url.title}
        description={p.steps.url.description}
        intro={p.steps.url.intro}
        sectionHelp={p.steps.url.sectionHelp}
      >
        <FormField
          required
          label={p.steps.url.field.label}
          hint={p.steps.url.field.hint}
          help={p.steps.url.field.help}
          example="https://www.amazon.it/dp/B08N5WRWNW"
        >
          <Input
            placeholder="https://www.amazon.it/dp/..."
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
          />
        </FormField>
      </StepSection>

      <StepSection
        step={2}
        title={p.steps.positioning.title}
        description={p.steps.positioning.description}
        intro={p.steps.positioning.intro}
        sectionHelp={p.steps.positioning.sectionHelp}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            required
            label={p.steps.positioning.audience.label}
            hint={p.steps.positioning.audience.hint}
            example={p.steps.positioning.audience.example}
            help={p.steps.positioning.audience.help}
          >
            <Input
              placeholder={p.steps.positioning.audience.example}
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            />
          </FormField>
          <FormField
            required
            label={p.steps.positioning.advantage.label}
            hint={p.steps.positioning.advantage.hint}
            example={p.steps.positioning.advantage.example}
            help={p.steps.positioning.advantage.help}
          >
            <Input
              placeholder={p.steps.positioning.advantage.example}
              value={advantage}
              onChange={(e) => setAdvantage(e.target.value)}
            />
          </FormField>
          <FormField
            className="md:col-span-2"
            optional
            label={p.steps.positioning.narrative.label}
            hint={p.steps.positioning.narrative.hint}
            help={p.steps.positioning.narrative.help}
          >
            <Textarea
              placeholder={p.steps.positioning.narrative.placeholder}
              rows={5}
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
            />
          </FormField>
        </div>
      </StepSection>

      <StepSection
        step={3}
        title={p.steps.result.title}
        description={p.steps.result.description}
        intro={p.steps.result.intro}
      >
        <EmptyState title={p.steps.result.emptyTitle} description={p.steps.result.emptyBody} />
      </StepSection>

      <div className="space-y-2 pb-6">
        {lastSavedAt ? <p className="text-xs text-slate-500">Salvato alle {lastSavedAt}</p> : null}
      </div>

      <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:justify-end">
        <Button variant="ghost" type="button" onClick={() => void persist("draft")} disabled={!isReady}>
          {it.common.saveDraft}
        </Button>
        {workItemId ? <MoveToProjectPopover workItemId={workItemId} compact /> : null}
        <Button type="button" onClick={() => void persist("in_progress")} disabled={!isReady}>
          {it.common.generateProposal}
        </Button>
      </div>
    </main>
  );
}
