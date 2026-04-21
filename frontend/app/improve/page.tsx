"use client";

import { EmptyState } from "@/components/workflow/empty-state";
import { FormField } from "@/components/workflow/form-field";
import { StepSection } from "@/components/workflow/step-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { it } from "@/lib/i18n/it";

const p = it.improve;

export default function ImprovePage() {
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
        title={p.steps.scope.title}
        description={p.steps.scope.description}
        intro={p.steps.scope.intro}
        sectionHelp={p.steps.scope.sectionHelp}
      >
        <Tabs
          groupLabel={p.steps.scope.tabsAriaLabel}
          items={[
            {
              key: "copy",
              label: p.steps.scope.tabs.copy,
              content: (
                <FormField
                  label={p.steps.scope.copyField.label}
                  hint={p.steps.scope.copyField.hint}
                  help={p.steps.scope.copyField.help}
                >
                  <Textarea placeholder={p.steps.scope.copyField.placeholder} rows={5} />
                </FormField>
              ),
            },
            {
              key: "keywords",
              label: p.steps.scope.tabs.keywords,
              content: (
                <FormField
                  label={p.steps.scope.kwField.label}
                  hint={p.steps.scope.kwField.hint}
                  help={p.steps.scope.kwField.help}
                >
                  <Textarea placeholder={p.steps.scope.kwField.placeholder} rows={5} />
                </FormField>
              ),
            },
          ]}
        />
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
          {it.common.cancel}
        </Button>
        <Button type="button">{it.common.startAudit}</Button>
      </div>
    </main>
  );
}
