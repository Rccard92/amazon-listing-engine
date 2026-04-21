"use client";

import { EmptyState } from "@/components/workflow/empty-state";
import { FormField } from "@/components/workflow/form-field";
import { StepSection } from "@/components/workflow/step-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { it } from "@/lib/i18n/it";

const p = it.competitor;

export default function CompetitorPage() {
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
          <Input placeholder="https://www.amazon.it/dp/..." />
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
            <Input placeholder={p.steps.positioning.audience.example} />
          </FormField>
          <FormField
            required
            label={p.steps.positioning.advantage.label}
            hint={p.steps.positioning.advantage.hint}
            example={p.steps.positioning.advantage.example}
            help={p.steps.positioning.advantage.help}
          >
            <Input placeholder={p.steps.positioning.advantage.example} />
          </FormField>
          <FormField
            className="md:col-span-2"
            optional
            label={p.steps.positioning.narrative.label}
            hint={p.steps.positioning.narrative.hint}
            help={p.steps.positioning.narrative.help}
          >
            <Textarea placeholder={p.steps.positioning.narrative.placeholder} rows={5} />
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

      <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:justify-end">
        <Button variant="ghost" type="button">
          {it.common.saveDraft}
        </Button>
        <Button type="button">{it.common.generateProposal}</Button>
      </div>
    </main>
  );
}
