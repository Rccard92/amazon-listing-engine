"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { SectionOutputPanel } from "@/components/listing-generation/section-output-panel";
import { StrategySummaryPanel } from "@/components/listing-generation/strategy-summary-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  emptyStrategy,
  getConfirmedStrategyFromWorkItem,
  type ListingSectionResult,
  type ListingSectionType,
  type ValidationReport,
} from "@/lib/listing-generation";
import type { ConfirmedProductStrategy } from "@/lib/listing-generation";
import { it } from "@/lib/i18n/it";
import { getWorkItem, updateWorkItem } from "@/lib/work-items";

const p = it.listingGeneration;

type SectionStored =
  | { seo_title?: string | null; validation?: ValidationReport | null; post_processing_applied?: string[]; updated_at?: string }
  | { bullets?: string[] | null; validation?: ValidationReport | null; post_processing_applied?: string[]; updated_at?: string }
  | { description?: string | null; validation?: ValidationReport | null; post_processing_applied?: string[]; updated_at?: string }
  | {
      backend_search_terms?: string | null;
      validation?: ValidationReport | null;
      post_processing_applied?: string[];
      updated_at?: string;
    };

function getSectionsFromWorkItem(raw: Record<string, unknown> | undefined): Partial<Record<ListingSectionType, SectionStored>> {
  const lg = raw?.listing_generation;
  if (!lg || typeof lg !== "object" || Array.isArray(lg)) return {};
  const sections = (lg as { sections?: unknown }).sections;
  if (!sections || typeof sections !== "object" || Array.isArray(sections)) return {};
  return sections as Partial<Record<ListingSectionType, SectionStored>>;
}

const SECTION_KEYS: ListingSectionType[] = ["seo_title", "bullet_points", "description", "keyword_strategy"];

function ListingGenerazioneContent() {
  const searchParams = useSearchParams();
  const workItemId = searchParams.get("workItemId");

  const [strategy, setStrategy] = useState<ConfirmedProductStrategy>(() => emptyStrategy());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveHint, setSaveHint] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [activeSection, setActiveSection] = useState<ListingSectionType>("seo_title");

  const [seoText, setSeoText] = useState("");
  const [bulletsText, setBulletsText] = useState("");
  const [descText, setDescText] = useState("");
  const [kwText, setKwText] = useState("");

  const [valSeo, setValSeo] = useState<ValidationReport | null>(null);
  const [valBullets, setValBullets] = useState<ValidationReport | null>(null);
  const [valDesc, setValDesc] = useState<ValidationReport | null>(null);
  const [valKw, setValKw] = useState<ValidationReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!workItemId) return;
      const s = await getConfirmedStrategyFromWorkItem(workItemId);
      if (cancelled) return;
      if (!s) {
        setLoadError(p.loadStrategyError);
        return;
      }
      setStrategy(s);
      setLoadError(null);
      const item = await getWorkItem(workItemId);
      if (cancelled || !item) return;
      const storedMap = getSectionsFromWorkItem(item.generated_output as Record<string, unknown>);
      const stSeo = storedMap.seo_title as { seo_title?: string | null; validation?: ValidationReport | null } | undefined;
      if (stSeo?.seo_title) setSeoText(stSeo.seo_title);
      if (stSeo?.validation) setValSeo(stSeo.validation);
      const stBul = storedMap.bullet_points as { bullets?: string[] | null; validation?: ValidationReport | null } | undefined;
      if (stBul?.bullets?.length) setBulletsText(stBul.bullets.join("\n"));
      if (stBul?.validation) setValBullets(stBul.validation);
      const stDesc = storedMap.description as { description?: string | null; validation?: ValidationReport | null } | undefined;
      if (stDesc?.description) setDescText(stDesc.description);
      if (stDesc?.validation) setValDesc(stDesc.validation);
      const stKw = storedMap.keyword_strategy as {
        backend_search_terms?: string | null;
        validation?: ValidationReport | null;
      } | undefined;
      if (stKw?.backend_search_terms) setKwText(stKw.backend_search_terms);
      if (stKw?.validation) setValKw(stKw.validation);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [workItemId]);

  const persistSection = useCallback(
    async (section: ListingSectionType, result: ListingSectionResult) => {
      if (!workItemId) return;
      setSaving(true);
      setSaveHint(null);
      const item = await getWorkItem(workItemId);
      if (!item) {
        setSaving(false);
        return;
      }
      const prev = (item.generated_output || {}) as Record<string, unknown>;
      const lg =
        typeof prev.listing_generation === "object" && prev.listing_generation && !Array.isArray(prev.listing_generation)
          ? (prev.listing_generation as { sections?: Record<string, SectionStored> })
          : {};
      const sections = { ...(lg.sections || {}) };
      const now = new Date().toISOString();
      if (section === "seo_title") {
        sections.seo_title = {
          seo_title: result.seo_title,
          validation: result.validation,
          post_processing_applied: result.post_processing_applied,
          updated_at: now,
        };
      } else if (section === "bullet_points") {
        sections.bullet_points = {
          bullets: result.bullets,
          validation: result.validation,
          post_processing_applied: result.post_processing_applied,
          updated_at: now,
        };
      } else if (section === "description") {
        sections.description = {
          description: result.description,
          validation: result.validation,
          post_processing_applied: result.post_processing_applied,
          updated_at: now,
        };
      } else {
        sections.keyword_strategy = {
          backend_search_terms: result.backend_search_terms,
          validation: result.validation,
          post_processing_applied: result.post_processing_applied,
          updated_at: now,
        };
      }
      await updateWorkItem(workItemId, {
        generated_output: {
          ...prev,
          listing_generation: { ...lg, sections },
        },
      });
      setSaving(false);
      setSaveHint(p.actions.savedOutput);
    },
    [workItemId],
  );

  const onGenerated = (section: ListingSectionType, result: ListingSectionResult) => {
    void persistSection(section, result);
  };

  async function saveCurrentDraft() {
    if (!workItemId) return;
    setSaving(true);
    setSaveHint(null);
    const item = await getWorkItem(workItemId);
    if (!item) {
      setSaving(false);
      return;
    }
    const prev = (item.generated_output || {}) as Record<string, unknown>;
    const lg =
      typeof prev.listing_generation === "object" && prev.listing_generation && !Array.isArray(prev.listing_generation)
        ? (prev.listing_generation as { sections?: Record<string, SectionStored> })
        : {};
    const sections = { ...(lg.sections || {}) };
    const now = new Date().toISOString();
    const bulletLines = bulletsText
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
    if (activeSection === "seo_title") {
      sections.seo_title = { seo_title: seoText, updated_at: now, validation: valSeo };
    } else if (activeSection === "bullet_points") {
      sections.bullet_points = { bullets: bulletLines, updated_at: now, validation: valBullets };
    } else if (activeSection === "description") {
      sections.description = { description: descText, updated_at: now, validation: valDesc };
    } else {
      sections.keyword_strategy = { backend_search_terms: kwText, updated_at: now, validation: valKw };
    }
    await updateWorkItem(workItemId, {
      generated_output: { ...prev, listing_generation: { ...lg, sections } },
    });
    setSaving(false);
    setSaveHint(p.actions.savedOutput);
  }

  const panelProps =
    activeSection === "seo_title"
      ? {
          section: "seo_title" as const,
          text: seoText,
          bulletsText,
          onTextChange: setSeoText,
          onBulletsChange: setBulletsText,
          validation: valSeo,
          onValidation: setValSeo,
          onGenerated: (res: ListingSectionResult) => onGenerated("seo_title", res),
        }
      : activeSection === "bullet_points"
        ? {
            section: "bullet_points" as const,
            text: descText,
            bulletsText,
            onTextChange: setDescText,
            onBulletsChange: setBulletsText,
            validation: valBullets,
            onValidation: setValBullets,
            onGenerated: (res: ListingSectionResult) => onGenerated("bullet_points", res),
          }
        : activeSection === "description"
          ? {
              section: "description" as const,
              text: descText,
              bulletsText,
              onTextChange: setDescText,
              onBulletsChange: setBulletsText,
              validation: valDesc,
              onValidation: setValDesc,
              onGenerated: (res: ListingSectionResult) => onGenerated("description", res),
            }
          : {
              section: "keyword_strategy" as const,
              text: kwText,
              bulletsText,
              onTextChange: setKwText,
              onBulletsChange: setBulletsText,
              validation: valKw,
              onValidation: setValKw,
              onGenerated: (res: ListingSectionResult) => onGenerated("keyword_strategy", res),
            };

  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{p.pageTitle}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{p.pageSubtitle}</p>
        {workItemId ? (
          <p className="mt-3 text-xs font-medium text-slate-500">
            {p.workItemHint} · ID: {workItemId}
          </p>
        ) : null}
        {loadError ? <p className="mt-3 text-sm text-amber-800">{loadError}</p> : null}
      </header>

      <section className="surface-card rounded-4xl p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">{p.strategyPanelTitle}</h2>
        <p className="mt-1 text-sm text-slate-600">{p.strategyPanelHint}</p>
        <div className="mt-6">
          <StrategySummaryPanel strategy={strategy} onChange={setStrategy} />
        </div>
      </section>

      <section className="surface-card rounded-4xl p-6 sm:p-8">
        <div
          className="inline-flex w-full flex-wrap gap-2 rounded-2xl bg-slate-100/80 p-1.5"
          aria-label="Sezioni di generazione"
        >
          {SECTION_KEYS.map((key) => {
            const isActive = key === activeSection;
            return (
              <button
                key={key}
                type="button"
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition",
                  isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
                )}
                onClick={() => setActiveSection(key)}
              >
                {p.sections[key].label}
              </button>
            );
          })}
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/90 p-5">
          <SectionOutputPanel strategy={strategy} {...panelProps} />
        </div>
        {workItemId ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={() => void saveCurrentDraft()}>
              {p.actions.saveOutput}
            </Button>
            {saveHint ? <span className="text-xs text-slate-500">{saveHint}</span> : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default function ListingGenerazionePage() {
  return (
    <Suspense
      fallback={
        <main className="p-8">
          <p className="text-sm text-slate-600">{it.common.loading}</p>
        </main>
      }
    >
      <ListingGenerazioneContent />
    </Suspense>
  );
}
