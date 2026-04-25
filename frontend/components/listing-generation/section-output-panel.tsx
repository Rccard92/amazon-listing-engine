"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AiTracePanel } from "@/components/ai-trace/ai-trace-panel";
import type {
  AiDebugTrace,
  GeneratedFrontendContent,
  ListingSectionResult,
  ListingSectionType,
} from "@/lib/listing-generation";
import { generateListingSection, type ConfirmedProductStrategy } from "@/lib/listing-generation";
import { it } from "@/lib/i18n/it";
import { Textarea } from "@/components/ui/textarea";

const p = it.listingGeneration;
const errCat = it.workflowErrors as Record<string, string>;

type Props = {
  section: ListingSectionType;
  strategy: ConfirmedProductStrategy;
  text: string;
  bullets: string[];
  onTextChange: (v: string) => void;
  onBulletsChange: (v: string[]) => void;
  validation: ListingSectionResult["validation"] | null;
  onValidation: (v: ListingSectionResult["validation"] | null) => void;
  onGenerated: (result: ListingSectionResult) => void;
  generatedFrontendContent?: GeneratedFrontendContent | null;
  aiDebugEnabled?: boolean;
};

const BULLETS_COUNT = 5;

function splitSingleBlob(raw: string): string[] {
  const text = raw.trim();
  if (!text) return [];
  const jsonLike = text.match(/\{[\s\S]*\}/)?.[0];
  if (jsonLike) {
    try {
      const parsed = JSON.parse(jsonLike) as { bullets?: unknown };
      if (Array.isArray(parsed.bullets)) {
        return parsed.bullets.map((x) => String(x).trim()).filter(Boolean);
      }
      if (typeof parsed.bullets === "string") {
        return parsed.bullets.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
      }
    } catch {
      // fallback sotto
    }
  }
  return text
    .split(/\r?\n/)
    .map((x) => x.replace(/^\s*(?:[-*•]\s+|\d+[\).]\s+)/, "").trim())
    .filter(Boolean);
}

function normalizeBullets(raw: string[] | null | undefined): string[] {
  let src = Array.isArray(raw) ? raw.map((x) => String(x)) : [];
  if (src.length === 1 && /[\n\{\[]/.test(src[0])) {
    src = splitSingleBlob(src[0]);
  }
  return Array.from({ length: BULLETS_COUNT }, (_, i) => String(src[i] ?? ""));
}

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
  bullets,
  onTextChange,
  onBulletsChange,
  validation,
  onValidation,
  onGenerated,
  generatedFrontendContent,
  aiDebugEnabled = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [trace, setTrace] = useState<AiDebugTrace | null>(null);

  async function runGenerate() {
    if (!strategy.nome_prodotto.trim()) {
      setError("Inserisci almeno il nome prodotto nella strategia.");
      return;
    }
    setError(null);
    setLoading(true);
    const res = await generateListingSection({
      strategy,
      section,
      include_raw_model_text: aiDebugEnabled,
      include_debug_trace: aiDebugEnabled,
      generated_frontend_content: section === "keyword_strategy" ? generatedFrontendContent ?? null : null,
    });
    setLoading(false);
    if (!res.ok) {
      const msg = res.error ? errCat[res.error.error_code] ?? res.error.message_it : "Errore di rete.";
      setError(msg);
      return;
    }
    onGenerated(res.data);
    setTrace(res.data.debug_trace ?? null);
    onValidation(res.data.validation);
    if (section === "bullet_points") {
      onBulletsChange(normalizeBullets(res.data.bullets));
    } else if (section === "seo_title" && res.data.seo_title) {
      onTextChange(res.data.seo_title);
    } else if (section === "description" && res.data.description) {
      onTextChange(res.data.description);
    } else if (section === "keyword_strategy" && res.data.backend_search_terms) {
      onTextChange(res.data.backend_search_terms);
    }
  }

  async function copyToClipboard(payload: string, feedbackKey: string) {
    if (!payload.trim()) return;
    try {
      await navigator.clipboard.writeText(payload);
      setCopyFeedback(feedbackKey);
      setTimeout(() => setCopyFeedback((prev) => (prev === feedbackKey ? null : prev)), 1400);
    } catch {
      setError("Copia negata dal browser.");
    }
  }

  function updateBullet(index: number, value: string) {
    const next = normalizeBullets(bullets);
    next[index] = value;
    onBulletsChange(next);
  }

  function allBulletsText(): string {
    return normalizeBullets(bullets)
      .map((b) => b.trim())
      .filter(Boolean)
      .join("\n");
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
        {section === "bullet_points" ? (
          <Button type="button" size="sm" variant="ghost" onClick={() => void copyToClipboard(allBulletsText(), "all")}>
            {copyFeedback === "all" ? p.actions.copied : p.actions.copyAll}
          </Button>
        ) : (
          <Button type="button" size="sm" variant="ghost" onClick={() => void copyToClipboard(text, "text")}>
            {copyFeedback === "text" ? p.actions.copied : p.actions.copy}
          </Button>
        )}
      </div>
      {error ? (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/80 px-4 py-3">
          <p className="text-sm font-medium text-rose-700">{error}</p>
          <p className="mt-1 text-xs text-rose-700/90">{p.generationErrorHint}</p>
        </div>
      ) : null}
      {aiDebugEnabled ? <AiTracePanel trace={trace} /> : null}
      {section === "bullet_points" ? (
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-500">{p.editorHint}</p>
          {normalizeBullets(bullets).map((bullet, index) => (
            <div key={index} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">
                  {p.bullets.itemLabel} {index + 1}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void copyToClipboard(bullet, `bullet-${index}`)}
                  className="h-7 px-2 text-xs"
                >
                  {copyFeedback === `bullet-${index}` ? p.actions.copied : p.actions.copy}
                </Button>
              </div>
              <Textarea
                rows={3}
                value={bullet}
                onChange={(e) => updateBullet(index, e.target.value)}
                className="rounded-xl text-sm leading-relaxed"
                placeholder={`${p.bullets.itemPlaceholder} ${index + 1}`}
              />
            </div>
          ))}
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
