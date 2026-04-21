"use client";

import { FormField } from "@/components/workflow/form-field";
import { StepSection } from "@/components/workflow/step-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { UploadDropzone } from "@/components/ui/upload-dropzone";
import { it } from "@/lib/i18n/it";

const p = it.newListing;

export default function NewListingPage() {
  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{p.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">{p.subtitle}</p>
      </header>

      <StepSection
        step={1}
        title={p.steps.product.title}
        description={p.steps.product.description}
        intro={p.steps.product.intro}
        sectionHelp={p.steps.product.sectionHelp}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            required
            label={p.steps.product.fields.name.label}
            hint={p.steps.product.fields.name.hint}
            example={p.steps.product.fields.name.example}
            help={p.steps.product.fields.name.help}
          >
            <Input placeholder={p.steps.product.fields.name.example} />
          </FormField>
          <FormField
            optional
            label={p.steps.product.fields.category.label}
            hint={p.steps.product.fields.category.hint}
            example={p.steps.product.fields.category.example}
            help={p.steps.product.fields.category.help}
          >
            <Input placeholder={p.steps.product.fields.category.example} />
          </FormField>
          <FormField
            className="md:col-span-2"
            required
            label={p.steps.product.fields.benefits.label}
            hint={p.steps.product.fields.benefits.hint}
            example={p.steps.product.fields.benefits.example}
            help={p.steps.product.fields.benefits.help}
          >
            <Textarea placeholder={p.steps.product.fields.benefits.example} />
          </FormField>
        </div>
      </StepSection>

      <StepSection
        step={2}
        title={p.steps.keywords.title}
        description={p.steps.keywords.description}
        intro={p.steps.keywords.intro}
        sectionHelp={p.steps.keywords.sectionHelp}
      >
        <Tabs
          groupLabel={p.steps.keywords.tabsAriaLabel}
          items={[
            {
              key: "manual",
              label: p.steps.keywords.tabs.manual,
              content: (
                <FormField
                  label={p.steps.keywords.manual.label}
                  hint={p.steps.keywords.manual.hint}
                  help={p.steps.keywords.manual.help}
                >
                  <Textarea placeholder={p.steps.keywords.manual.placeholder} rows={5} />
                </FormField>
              ),
            },
            {
              key: "csv",
              label: p.steps.keywords.tabs.csv,
              content: <p className="text-sm leading-relaxed text-slate-600">{p.steps.keywords.csvBlurb}</p>,
            },
          ]}
        />
      </StepSection>

      <StepSection
        step={3}
        title={p.steps.upload.title}
        description={p.steps.upload.description}
        intro={p.steps.upload.intro}
        sectionHelp={p.steps.upload.sectionHelp}
      >
        <UploadDropzone
          title={p.dropzone.title}
          description={p.dropzone.description}
          emptyMessage={p.dropzone.empty}
          selectedHeading={p.dropzone.selectedHeading}
          footerHint={p.dropzone.hintLine}
        />
      </StepSection>

      <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:justify-end">
        <Button variant="ghost" type="button">
          {it.common.saveDraft}
        </Button>
        <Button type="button">{it.common.continue}</Button>
      </div>
    </main>
  );
}
