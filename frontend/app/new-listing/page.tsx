"use client";

import { useEffect, useMemo, useState } from "react";

import { MoveToProjectPopover } from "@/components/projects/move-to-project-popover";
import { FormField } from "@/components/workflow/form-field";
import { StepSection } from "@/components/workflow/step-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { UploadDropzone } from "@/components/ui/upload-dropzone";
import { it } from "@/lib/i18n/it";
import { useWorkItemDraft } from "@/lib/use-work-item-draft";

const p = it.newListing;

export default function NewListingPage() {
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("");
  const [benefits, setBenefits] = useState("");
  const [manualKeywords, setManualKeywords] = useState("");
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const fallbackTitle = useMemo(() => p.title, []);
  const draft = useWorkItemDraft({ workflowType: "new_listing", fallbackTitle });
  const { isReady, load, save, workItemId } = draft;

  useEffect(() => {
    let cancelled = false;
    async function preload() {
      if (!isReady) return;
      const item = await load();
      if (!item || cancelled) return;
      const input = item.input_data as Record<string, unknown>;
      const keyword = item.keyword_data as Record<string, unknown>;
      setProductName((input.product_name as string) || "");
      setCategory((input.category as string) || "");
      setBenefits((input.benefits as string) || "");
      setManualKeywords((keyword.manual_keywords as string) || "");
      setUploadedFileNames((keyword.uploaded_files as string[]) || []);
    }
    void preload();
    return () => {
      cancelled = true;
    };
  }, [isReady, load]);

  async function persist(status: "draft" | "in_progress" | "completed" = "draft") {
    const summary = [productName, category].filter(Boolean).join(" • ") || "Bozza nuova scheda prodotto";
    await save({
      title: productName || p.title,
      summary,
      inputData: { product_name: productName, category, benefits },
      keywordData: { manual_keywords: manualKeywords, uploaded_files: uploadedFileNames },
      generatedOutput: {},
      status,
    });
    setLastSavedAt(new Date().toLocaleTimeString("it-IT"));
  }

  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{p.title} (avanzato)</h1>
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
            <Input
              placeholder={p.steps.product.fields.name.example}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
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
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </FormField>
          <FormField
            className="md:col-span-2"
            required
            label={p.steps.product.fields.benefits.label}
            hint={p.steps.product.fields.benefits.hint}
            example={p.steps.product.fields.benefits.example}
            help={p.steps.product.fields.benefits.help}
          >
            <Textarea
              placeholder={p.steps.product.fields.benefits.example}
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
            />
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
                  <Textarea
                    placeholder={p.steps.keywords.manual.placeholder}
                    rows={5}
                    value={manualKeywords}
                    onChange={(e) => setManualKeywords(e.target.value)}
                  />
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
          onFilesSelected={(files) => setUploadedFileNames(files.map((f) => f.name))}
        />
      </StepSection>

      <div className="space-y-2 pb-6">
        {lastSavedAt ? <p className="text-xs text-slate-500">Salvato alle {lastSavedAt}</p> : null}
        {!isReady ? <p className="text-xs text-slate-500">Preparazione bozza in Cronologia...</p> : null}
      </div>

      <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:justify-end">
        <Button variant="ghost" type="button" onClick={() => void persist("draft")} disabled={!isReady}>
          {it.common.saveDraft}
        </Button>
        {workItemId ? <MoveToProjectPopover workItemId={workItemId} compact /> : null}
        <Button type="button" onClick={() => void persist("in_progress")} disabled={!isReady}>
          {it.common.continue}
        </Button>
      </div>
    </main>
  );
}
