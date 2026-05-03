"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SectionOutputPanel } from "@/components/listing-generation/section-output-panel";
import { StrategySummaryPanel } from "@/components/listing-generation/strategy-summary-panel";
import { Button } from "@/components/ui/button";
import { fetchFeatureFlags } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  emptyStrategy,
  getConfirmedStrategyFromWorkItem,
  hasListingKeywordAnchor,
  type ListingSectionResult,
  type ListingSectionType,
  type ValidationReport,
} from "@/lib/listing-generation";
import type { ConfirmedProductStrategy } from "@/lib/listing-generation";
import { it } from "@/lib/i18n/it";
import { getWorkItem, updateWorkItem, type WorkItemStatus } from "@/lib/work-items";

const p = it.listingGeneration;
const BULLETS_COUNT = 5;

function splitLegacyBulletBlob(raw: string): string[] {
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

function normalizeBullets(raw: unknown): string[] {
  let src: string[] = [];
  if (Array.isArray(raw)) {
    src = raw.map((x) => String(x));
  } else if (typeof raw === "string") {
    src = splitLegacyBulletBlob(raw);
  }
  if (src.length === 1 && /[\n\{\[]/.test(src[0])) {
    src = splitLegacyBulletBlob(src[0]);
  }
  return Array.from({ length: BULLETS_COUNT }, (_, i) => String(src[i] ?? ""));
}

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const workItemId = searchParams.get("workItemId");

  const [strategy, setStrategy] = useState<ConfirmedProductStrategy>(() => emptyStrategy());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveHint, setSaveHint] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [recapOpen, setRecapOpen] = useState(false);

  const [activeSection, setActiveSection] = useState<ListingSectionType>("seo_title");

  const [seoText, setSeoText] = useState("");
  const [bullets, setBullets] = useState<string[]>(() => normalizeBullets([]));
  const [descText, setDescText] = useState("");
  const [kwText, setKwText] = useState("");

  const [valSeo, setValSeo] = useState<ValidationReport | null>(null);
  const [valBullets, setValBullets] = useState<ValidationReport | null>(null);
  const [valDesc, setValDesc] = useState<ValidationReport | null>(null);
  const [valKw, setValKw] = useState<ValidationReport | null>(null);
  const [aiDebugEnabled, setAiDebugEnabled] = useState(false);
  const [workItemStatus, setWorkItemStatus] = useState<WorkItemStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadFeatures() {
      const features = await fetchFeatureFlags();
      if (cancelled || !features) return;
      setAiDebugEnabled(Boolean(features.ai_debug_trace_enabled));
    }
    void loadFeatures();
    return () => {
      cancelled = true;
    };
  }, []);

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
      setWorkItemStatus(item.status);
      const storedMap = getSectionsFromWorkItem(item.generated_output as Record<string, unknown>);
      const stSeo = storedMap.seo_title as { seo_title?: string | null; validation?: ValidationReport | null } | undefined;
      if (stSeo?.seo_title) setSeoText(stSeo.seo_title);
      if (stSeo?.validation) setValSeo(stSeo.validation);
      const stBul = storedMap.bullet_points as { bullets?: string[] | null; validation?: ValidationReport | null } | undefined;
      setBullets(normalizeBullets(stBul?.bullets));
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
        const normalized = normalizeBullets(result.bullets);
        sections.bullet_points = {
          bullets: normalized,
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
      const patch: Parameters<typeof updateWorkItem>[1] = {
        generated_output: {
          ...prev,
          listing_generation: { ...lg, sections },
        },
      };
      if (item.status !== "completed") {
        patch.status = "in_progress";
      }
      await updateWorkItem(workItemId, patch);
      setSaving(false);
      if (patch.status) setWorkItemStatus(patch.status);
      setSaveHint(p.actions.savedOutput);
    },
    [workItemId],
  );

  const onGenerated = (section: ListingSectionType, result: ListingSectionResult) => {
    void persistSection(section, result);
  };

  async function saveCurrentDraft(): Promise<boolean> {
    if (!workItemId) return false;
    setSaving(true);
    setSaveHint(null);
    const item = await getWorkItem(workItemId);
    if (!item) {
      setSaving(false);
      return false;
    }
    const prev = (item.generated_output || {}) as Record<string, unknown>;
    const lg =
      typeof prev.listing_generation === "object" && prev.listing_generation && !Array.isArray(prev.listing_generation)
        ? (prev.listing_generation as { sections?: Record<string, SectionStored> })
        : {};
    const sections = { ...(lg.sections || {}) };
    const now = new Date().toISOString();
    if (activeSection === "seo_title") {
      sections.seo_title = { seo_title: seoText, updated_at: now, validation: valSeo };
    } else if (activeSection === "bullet_points") {
      sections.bullet_points = { bullets: normalizeBullets(bullets), updated_at: now, validation: valBullets };
    } else if (activeSection === "description") {
      sections.description = { description: descText, updated_at: now, validation: valDesc };
    } else {
      sections.keyword_strategy = { backend_search_terms: kwText, updated_at: now, validation: valKw };
    }
    const patch: Parameters<typeof updateWorkItem>[1] = {
      generated_output: { ...prev, listing_generation: { ...lg, sections } },
    };
    if (item.status !== "completed") {
      patch.status = "in_progress";
    }
    await updateWorkItem(workItemId, patch);
    setSaving(false);
    if (patch.status) setWorkItemStatus(patch.status);
    setSaveHint(p.actions.savedOutput);
    return true;
  }

  async function saveProjectCompleted(): Promise<boolean> {
    if (!workItemId) return false;
    setSaving(true);
    setSaveHint(null);
    const item = await getWorkItem(workItemId);
    if (!item) {
      setSaving(false);
      return false;
    }
    const prev = (item.generated_output || {}) as Record<string, unknown>;
    const lg =
      typeof prev.listing_generation === "object" && prev.listing_generation && !Array.isArray(prev.listing_generation)
        ? (prev.listing_generation as { sections?: Record<string, SectionStored> })
        : {};
    const sections = { ...(lg.sections || {}) };
    const now = new Date().toISOString();
    sections.seo_title = { seo_title: seoText, updated_at: now, validation: valSeo };
    sections.bullet_points = { bullets: normalizeBullets(bullets), updated_at: now, validation: valBullets };
    sections.description = { description: descText, updated_at: now, validation: valDesc };
    sections.keyword_strategy = { backend_search_terms: kwText, updated_at: now, validation: valKw };
    await updateWorkItem(workItemId, {
      generated_output: { ...prev, listing_generation: { ...lg, sections } },
      status: "completed",
    });
    setWorkItemStatus("completed");
    setSaving(false);
    setSaveHint(p.actions.savedProject);
    return true;
  }

  async function handleGoBack() {
    if (!workItemId) return;
    const saved = await saveCurrentDraft();
    if (!saved) return;
    router.push(`/keyword-intelligence?workItemId=${workItemId}`);
  }

  const panelProps =
    activeSection === "seo_title"
      ? {
          section: "seo_title" as const,
          text: seoText,
          bullets,
          onTextChange: setSeoText,
          onBulletsChange: setBullets,
          validation: valSeo,
          onValidation: setValSeo,
          onGenerated: (res: ListingSectionResult) => onGenerated("seo_title", res),
          generatedFrontendContent: { seo_title: seoText, bullets: normalizeBullets(bullets), description: descText },
        }
      : activeSection === "bullet_points"
        ? {
            section: "bullet_points" as const,
            text: descText,
            bullets,
            onTextChange: setDescText,
            onBulletsChange: setBullets,
            validation: valBullets,
            onValidation: setValBullets,
            onGenerated: (res: ListingSectionResult) => onGenerated("bullet_points", res),
            generatedFrontendContent: { seo_title: seoText, bullets: normalizeBullets(bullets), description: descText },
          }
        : activeSection === "description"
          ? {
              section: "description" as const,
              text: descText,
              bullets,
              onTextChange: setDescText,
              onBulletsChange: setBullets,
              validation: valDesc,
              onValidation: setValDesc,
              onGenerated: (res: ListingSectionResult) => onGenerated("description", res),
              generatedFrontendContent: { seo_title: seoText, bullets: normalizeBullets(bullets), description: descText },
            }
          : {
              section: "keyword_strategy" as const,
              text: kwText,
              bullets,
              onTextChange: setKwText,
              onBulletsChange: setBullets,
              validation: valKw,
              onValidation: setValKw,
              onGenerated: (res: ListingSectionResult) => onGenerated("keyword_strategy", res),
              generatedFrontendContent: { seo_title: seoText, bullets: normalizeBullets(bullets), description: descText },
            };

  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{p.phase3Badge}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{p.pageTitle}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{p.pageSubtitle}</p>
        {workItemId ? (
          <p className="mt-3 text-xs font-medium text-slate-500">
            {p.workItemHint} · ID: {workItemId}
            {workItemStatus === "completed" ? ` · ${p.projectStatusCompletedHint}` : null}
          </p>
        ) : null}
        {loadError ? <p className="mt-3 text-sm text-amber-800">{loadError}</p> : null}
      </header>

      <section className="surface-card rounded-4xl border border-slate-200/80 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{p.strategyPanelTitle}</p>
            <p className="mt-1 text-xs text-slate-600">{p.recapHint}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setRecapOpen((v) => !v)}>
            {recapOpen ? p.recapToggleHide : p.recapToggleShow}
          </Button>
        </div>
        {recapOpen ? (
          <div className="mt-4 space-y-4 rounded-2xl border border-slate-200/80 bg-white/90 p-4">
            <section aria-label={p.readinessTitle}>
              <h2 className="text-sm font-semibold text-slate-900">{p.readinessTitle}</h2>
              <p className="mt-1 text-xs text-slate-600">{p.readinessIntro}</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li className={strategy.nome_prodotto.trim() ? "text-emerald-800" : "text-amber-800"}>
                  {strategy.nome_prodotto.trim() ? `✓ ${p.readinessNomeOk}` : `· ${p.readinessNomeKo}`}
                </li>
                <li className={hasListingKeywordAnchor(strategy) ? "text-emerald-800" : "text-amber-800"}>
                  {hasListingKeywordAnchor(strategy) ? `✓ ${p.readinessKwOk}` : `· ${p.readinessKwKo}`}
                </li>
                <li
                  className={
                    strategy.benefici_principali.length || (strategy.usp_differenziazione || "").trim()
                      ? "text-emerald-800"
                      : "text-amber-800"
                  }
                >
                  {strategy.benefici_principali.length || (strategy.usp_differenziazione || "").trim()
                    ? `✓ ${p.readinessBenefitOk}`
                    : `· ${p.readinessBenefitKo}`}
                </li>
              </ul>
            </section>
            <section>
              <p className="text-sm font-semibold text-slate-900">{p.strategyPanelHint}</p>
              <div className="mt-3">
                <StrategySummaryPanel strategy={strategy} onChange={setStrategy} />
              </div>
            </section>
          </div>
        ) : null}
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
          <SectionOutputPanel strategy={strategy} aiDebugEnabled={aiDebugEnabled} {...panelProps} />
        </div>
        {workItemId ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={saving}
              onClick={() => void handleGoBack()}
              className="sm:mr-auto"
            >
              Indietro
            </Button>
            <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={() => void saveCurrentDraft()}>
              {p.actions.saveOutput}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              className="rounded-xl bg-emerald-700 px-4 text-white shadow-sm hover:bg-emerald-800"
              onClick={() => void saveProjectCompleted()}
            >
              {p.actions.saveProject}
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
