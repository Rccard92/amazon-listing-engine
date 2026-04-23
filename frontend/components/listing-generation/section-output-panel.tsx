"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { ListingSectionResult, ListingSectionType } from "@/lib/listing-generation";
import { generateListingSection, type ConfirmedProductStrategy } from "@/lib/listing-generation";
import { it } from "@/lib/i18n/it";
import { Textarea } from "@/components/ui/textarea";

const p = it.listingGeneration;
const errCat = it.workflowErrors as Record<string, string>;

type Props = {
  section: ListingSectionType;
  strategy: ConfirmedProductStrategy;
  text: string;
  bulletsText: string;
  onTextChange: (v: string) => void;
  onBulletsChange: (v: string) => void;
  validation: ListingSectionResult["validation"] | null;
  onValidation: (v: ListingSectionResult["validation"] | null) => void;
  onGenerated: (result: ListingSectionResult) => void;
};

function sectionGoal(section: ListingSectionType): string {
  return p.sections[section].goal;
}

function sectionLabel(section: ListingSectionType): string {
  return p.sections[section].label;
}

export function SectionOutputPanel({
  section,
  strategy,
  text,
  bulletsText,
  onTextChange,
  onBulletsChange,
  validation,
  onValidation,
  onGenerated,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runGenerate() {
    if (!strategy.nome_prodotto.trim()) {
      setError("Inserisci almeno il nome prodotto nella strategia.");
      return;
    }
    setError(null);
    setLoading(true);
    const res = await generateListingSection({ strategy, section, include_raw_model_text: false });
    setLoading(false);
    if (!res.ok) {
      const msg = res.error ? errCat[res.error.error_code] ?? res.error.message_it : "Errore di rete.";
      setError(msg);
      return;
    }
    onGenerated(res.data);
    onValidation(res.data.validation);
    if (section === "bullet_points" && res.data.bullets?.length) {
      onBulletsChange(res.data.bullets.join("\n"));
    } else if (section === "seo_title" && res.data.seo_title) {
      onTextChange(res.data.seo_title);
    } else if (section === "description" && res.data.description) {
      onTextChange(res.data.description);
    } else if (section === "keyword_strategy" && res.data.backend_search_terms) {
      onTextChange(res.data.backend_search_terms);
    }
  }

  async function copyToClipboard() {
    const payload = section === "bullet_points" ? bulletsText : text;
    if (!payload.trim()) return;
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      setError("Copia negata dal browser.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm text-slate-700">
        <p className="font-medium text-slate-900">{sectionLabel(section)}</p>
        <p className="mt-1 leading-relaxed text-slate-600">{sectionGoal(section)}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => void runGenerate()} disabled={loading}>
          {loading ? it.common.loading : p.actions.generate}
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => void runGenerate()} disabled={loading}>
          {p.actions.regenerate}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => void copyToClipboard()}>
          {p.actions.copy}
        </Button>
      </div>
      {error ? (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/80 px-4 py-3">
          <p className="text-sm font-medium text-rose-700">{error}</p>
          <p className="mt-1 text-xs text-rose-700/90">{p.generationErrorHint}</p>
        </div>
      ) : null}
      {section === "bullet_points" ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">{p.editorHint}</p>
          <Textarea
            rows={10}
            value={bulletsText}
            onChange={(e) => onBulletsChange(e.target.value)}
            className="rounded-2xl font-mono text-sm"
            placeholder="Un bullet per riga (5 consigliati)"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">{p.editorHint}</p>
          <Textarea
            rows={section === "description" ? 14 : 6}
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            className="rounded-2xl text-sm leading-relaxed"
          />
        </div>
      )}
      {validation?.issues?.length ? (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3">
          <p className="text-xs font-semibold text-amber-950">{p.validationTitle}</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-950/90">
            {validation.issues.map((i) => (
              <li key={`${i.code}-${i.message_it}`}>
                [{i.severity}] {i.message_it}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
