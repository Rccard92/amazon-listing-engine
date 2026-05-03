"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { APlusBriefView } from "@/components/creative-brief/a-plus-brief-view";
import { FaqBriefView } from "@/components/creative-brief/faq-brief-view";
import { GalleryBriefView } from "@/components/creative-brief/gallery-brief-view";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CREATIVE_BRIEF_A_PLUS_KEY,
  CREATIVE_BRIEF_FAQ_KEY,
  CREATIVE_BRIEF_GALLERY_KEY,
  buildAPlusStorage,
  buildFaqStorage,
  buildGalleryStorage,
  generateCreativeBrief,
  hasAreaContent,
  normalizeAPlusFromStored,
  normalizeFaqFromStored,
  normalizeGalleryFromStored,
  serializeAPlusForClipboard,
  serializeFaqForClipboard,
  serializeGalleryForClipboard,
  tryApplyGrezzoJson,
  type CreativeBriefAPlusPayload,
  type CreativeBriefArea,
  type CreativeBriefFaqPayload,
  type CreativeBriefGalleryPayload,
  type CreativeBriefGenerateResponse,
} from "@/lib/creative-brief";
import { it } from "@/lib/i18n/it";
import { cn } from "@/lib/utils";
import { getWorkItem, updateWorkItem, type WorkItemStatus } from "@/lib/work-items";

const c = it.creativeBrief;

type TabDef = { id: CreativeBriefArea; label: string; intro: string };

const TABS: TabDef[] = [
  { id: "gallery", label: c.tabGallery, intro: c.introGallery },
  { id: "a_plus", label: c.tabAPlus, intro: c.introAPlus },
  { id: "faq", label: c.tabFaq, intro: c.introFaq },
];

function grezzoTextForArea(
  area: CreativeBriefArea,
  gallery: CreativeBriefGalleryPayload | null,
  galleryLegacy: string,
  aPlus: CreativeBriefAPlusPayload | null,
  aPlusLegacy: string,
  faq: CreativeBriefFaqPayload | null,
  faqLegacy: string,
): string {
  if (area === "gallery") {
    return gallery ? JSON.stringify(gallery, null, 2) : galleryLegacy;
  }
  if (area === "a_plus") {
    return aPlus ? JSON.stringify(aPlus, null, 2) : aPlusLegacy;
  }
  return faq ? JSON.stringify(faq, null, 2) : faqLegacy;
}

function BriefCreativoInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workItemId = searchParams.get("workItemId");

  const [active, setActive] = useState<CreativeBriefArea>("gallery");
  const [galleryStructured, setGalleryStructured] = useState<CreativeBriefGalleryPayload | null>(null);
  const [galleryLegacy, setGalleryLegacy] = useState("");
  const [aPlusStructured, setAPlusStructured] = useState<CreativeBriefAPlusPayload | null>(null);
  const [aPlusLegacy, setAPlusLegacy] = useState("");
  const [faqStructured, setFaqStructured] = useState<CreativeBriefFaqPayload | null>(null);
  const [faqLegacy, setFaqLegacy] = useState("");

  const [grezzoText, setGrezzoText] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [parseWarning, setParseWarning] = useState<string | null>(null);
  const [workItemStatus, setWorkItemStatus] = useState<WorkItemStatus | null>(null);

  const syncGrezzoFromState = useCallback(
    (area: CreativeBriefArea) => {
      setGrezzoText(
        grezzoTextForArea(area, galleryStructured, galleryLegacy, aPlusStructured, aPlusLegacy, faqStructured, faqLegacy),
      );
    },
    [galleryStructured, galleryLegacy, aPlusStructured, aPlusLegacy, faqStructured, faqLegacy],
  );

  useEffect(() => {
    syncGrezzoFromState(active);
  }, [active, syncGrezzoFromState]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!workItemId) return;
      const item = await getWorkItem(workItemId);
      if (cancelled || !item) return;
      const go = item.generated_output as Record<string, unknown>;
      const g = normalizeGalleryFromStored(go[CREATIVE_BRIEF_GALLERY_KEY]);
      const ap = normalizeAPlusFromStored(go[CREATIVE_BRIEF_A_PLUS_KEY]);
      const fq = normalizeFaqFromStored(go[CREATIVE_BRIEF_FAQ_KEY]);
      setGalleryStructured(g.structured);
      setGalleryLegacy(g.legacyBody);
      setAPlusStructured(ap.structured);
      setAPlusLegacy(ap.legacyBody);
      setFaqStructured(fq.structured);
      setFaqLegacy(fq.legacyBody);
      setWorkItemStatus(item.status);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [workItemId]);

  function applyGenerateResponse(area: CreativeBriefArea, data: CreativeBriefGenerateResponse) {
    if (data.parse_warning) setParseWarning(data.parse_warning);
    else setParseWarning(null);

    if (area === "gallery") {
      if (data.gallery) {
        setGalleryStructured(data.gallery);
        setGalleryLegacy(data.legacy_body ?? "");
      } else {
        setGalleryStructured(null);
        setGalleryLegacy(data.legacy_body ?? "");
      }
    } else if (area === "a_plus") {
      if (data.a_plus) {
        setAPlusStructured(data.a_plus);
        setAPlusLegacy(data.legacy_body ?? "");
      } else {
        setAPlusStructured(null);
        setAPlusLegacy(data.legacy_body ?? "");
      }
    } else {
      if (data.faq) {
        setFaqStructured(data.faq);
        setFaqLegacy(data.legacy_body ?? "");
      } else {
        setFaqStructured(null);
        setFaqLegacy(data.legacy_body ?? "");
      }
    }
  }

  async function runGenerate(area: CreativeBriefArea) {
    if (!workItemId) return;
    setBusy(true);
    setError(null);
    setHint(null);
    const res = await generateCreativeBrief(workItemId, area);
    setBusy(false);
    if (!res.ok) {
      setError(res.error?.message_it ?? c.errorGeneric);
      return;
    }
    applyGenerateResponse(area, res.data);
  }

  function clipboardTextForArea(area: CreativeBriefArea): string {
    const lg = c.labels.gallery;
    const la = c.labels.aPlus;
    const lf = c.labels.faq;
    if (area === "gallery" && galleryStructured) {
      return serializeGalleryForClipboard(galleryStructured, {
        commonSpecs: lg.commonSpecs,
        role: lg.role,
        visualInstructions: lg.visualInstructions,
        shortMessage: lg.shortMessage,
        communicationAngle: lg.communicationAngle,
        designerInstructions: lg.designerInstructions,
        mistakesToAvoid: lg.mistakesToAvoid,
        productData: lg.productData,
      });
    }
    if (area === "a_plus" && aPlusStructured) {
      return serializeAPlusForClipboard(aPlusStructured, {
        dimensions: la.dimensions,
        visualObjective: la.visualObjective,
        whatToShow: la.whatToShow,
        suggestedText: la.suggestedText,
        layoutGuidance: la.layoutGuidance,
        elementsToHighlight: la.elementsToHighlight,
        mistakesToAvoid: la.mistakesToAvoid,
        productData: la.productData,
      });
    }
    if (area === "faq" && faqStructured) {
      return serializeFaqForClipboard(faqStructured, lf.question, lf.answer);
    }
    if (area === "gallery") return galleryLegacy;
    if (area === "a_plus") return aPlusLegacy;
    return faqLegacy;
  }

  const hasActiveContent = hasAreaContent(
    active === "gallery"
      ? galleryStructured
      : active === "a_plus"
        ? aPlusStructured
        : faqStructured,
    active === "gallery" ? galleryLegacy : active === "a_plus" ? aPlusLegacy : faqLegacy,
  );

  async function copyActive() {
    const t = clipboardTextForArea(active);
    if (!t.trim()) return;
    await navigator.clipboard.writeText(t);
    setCopyFeedback(c.copied);
    setTimeout(() => setCopyFeedback(null), 2000);
  }

  async function copyOneFaq(index: number, text: string) {
    await navigator.clipboard.writeText(text);
    setCopyFeedback(`${c.copiedFaq} ${index + 1}`);
    setTimeout(() => setCopyFeedback(null), 2000);
  }

  async function saveDraft() {
    if (!workItemId) return;
    setSaving(true);
    setHint(null);
    const item = await getWorkItem(workItemId);
    if (!item) {
      setSaving(false);
      return;
    }
    const prev = (item.generated_output || {}) as Record<string, unknown>;
    const now = new Date().toISOString();
    const patch: Parameters<typeof updateWorkItem>[1] = {
      generated_output: {
        ...prev,
        [CREATIVE_BRIEF_GALLERY_KEY]: buildGalleryStorage(galleryStructured, galleryLegacy, now),
        [CREATIVE_BRIEF_A_PLUS_KEY]: buildAPlusStorage(aPlusStructured, aPlusLegacy, now),
        [CREATIVE_BRIEF_FAQ_KEY]: buildFaqStorage(faqStructured, faqLegacy, now),
      },
    };
    if (item.status !== "completed") {
      patch.status = "in_progress";
    }
    await updateWorkItem(workItemId, patch);
    if (patch.status) setWorkItemStatus(patch.status);
    setSaving(false);
    setHint(c.savedDraft);
  }

  async function saveProject() {
    if (!workItemId) return;
    setSaving(true);
    setHint(null);
    const item = await getWorkItem(workItemId);
    if (!item) {
      setSaving(false);
      return;
    }
    const prev = (item.generated_output || {}) as Record<string, unknown>;
    const now = new Date().toISOString();
    await updateWorkItem(workItemId, {
      generated_output: {
        ...prev,
        [CREATIVE_BRIEF_GALLERY_KEY]: buildGalleryStorage(galleryStructured, galleryLegacy, now),
        [CREATIVE_BRIEF_A_PLUS_KEY]: buildAPlusStorage(aPlusStructured, aPlusLegacy, now),
        [CREATIVE_BRIEF_FAQ_KEY]: buildFaqStorage(faqStructured, faqLegacy, now),
      },
      status: "completed",
    });
    setWorkItemStatus("completed");
    setSaving(false);
    setHint(c.savedProject);
  }

  function applyGrezzo() {
    const res = tryApplyGrezzoJson(active, grezzoText);
    if (!res.ok) {
      setHint(`${c.grezzoError}: ${res.error}`);
      return;
    }
    if (active === "gallery" && res.gallery) {
      setGalleryStructured(res.gallery);
      setGalleryLegacy("");
    } else if (active === "a_plus" && res.a_plus) {
      setAPlusStructured(res.a_plus);
      setAPlusLegacy("");
    } else if (active === "faq" && res.faq) {
      setFaqStructured(res.faq);
      setFaqLegacy("");
    }
    setHint(c.grezzoApplied);
    setParseWarning(null);
  }

  const activeTab = TABS.find((t) => t.id === active)!;

  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.phaseBadge}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{c.pageTitle}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{c.pageSubtitle}</p>
        {workItemId ? (
          <p className="mt-3 text-xs font-medium text-slate-500">
            {c.workItemHint} · ID: {workItemId}
            {workItemStatus === "completed" ? ` · ${c.projectStatusHint}` : null}
          </p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        {parseWarning ? (
          <p className="mt-3 text-sm text-amber-800">
            <span className="font-semibold">{c.parseWarning}: </span>
            {parseWarning}
          </p>
        ) : null}
      </header>

      <section className="surface-card rounded-4xl p-6 sm:p-8">
        <div
          className="inline-flex w-full flex-wrap gap-2 rounded-2xl bg-slate-100/80 p-1.5"
          role="tablist"
          aria-label="Aree brief creativo"
        >
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition",
                  isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
                )}
                onClick={() => setActive(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-sm text-slate-600">{activeTab.intro}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" disabled={busy || !workItemId} onClick={() => void runGenerate(active)}>
            {hasActiveContent ? c.regenerate : c.generate}
          </Button>
          <Button type="button" variant="secondary" disabled={!hasActiveContent} onClick={() => void copyActive()}>
            {c.copy}
          </Button>
          {busy ? <span className="text-sm text-slate-500">{c.loading}</span> : null}
          {copyFeedback ? <span className="text-sm text-emerald-700">{copyFeedback}</span> : null}
        </div>

        <div className="mt-6">
          {active === "gallery" && galleryStructured ? <GalleryBriefView data={galleryStructured} /> : null}
          {active === "a_plus" && aPlusStructured ? <APlusBriefView data={aPlusStructured} /> : null}
          {active === "faq" && faqStructured ? (
            <FaqBriefView data={faqStructured} onCopyFaq={(i, t) => void copyOneFaq(i, t)} />
          ) : null}

          {!hasAreaContent(
            active === "gallery" ? galleryStructured : active === "a_plus" ? aPlusStructured : faqStructured,
            active === "gallery" ? galleryLegacy : active === "a_plus" ? aPlusLegacy : faqLegacy,
          ) ? (
            <p className="text-sm text-slate-500">{c.emptyArea}</p>
          ) : null}

          {active === "gallery" && !galleryStructured && galleryLegacy.trim() ? (
            <div className="surface-card rounded-2xl p-5 border border-amber-100 bg-amber-50/40">
              <p className="text-xs font-semibold text-amber-900">{c.legacyFallbackHint}</p>
              <pre className="mt-3 max-h-[360px] overflow-auto text-sm whitespace-pre-wrap text-slate-800">{galleryLegacy}</pre>
            </div>
          ) : null}
          {active === "a_plus" && !aPlusStructured && aPlusLegacy.trim() ? (
            <div className="surface-card rounded-2xl p-5 border border-amber-100 bg-amber-50/40">
              <p className="text-xs font-semibold text-amber-900">{c.legacyFallbackHint}</p>
              <pre className="mt-3 max-h-[360px] overflow-auto text-sm whitespace-pre-wrap text-slate-800">{aPlusLegacy}</pre>
            </div>
          ) : null}
          {active === "faq" && !faqStructured && faqLegacy.trim() ? (
            <div className="surface-card rounded-2xl p-5 border border-amber-100 bg-amber-50/40">
              <p className="text-xs font-semibold text-amber-900">{c.legacyFallbackHint}</p>
              <pre className="mt-3 max-h-[360px] overflow-auto text-sm whitespace-pre-wrap text-slate-800">{faqLegacy}</pre>
            </div>
          ) : null}
        </div>

        <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-slate-800">{c.rawAccordionTitle}</summary>
          <p className="mt-2 text-xs text-slate-600">{c.rawAccordionHint}</p>
          <Textarea
            className="mt-3 min-h-[200px] rounded-2xl text-sm font-mono leading-relaxed"
            value={grezzoText}
            onChange={(e) => setGrezzoText(e.target.value)}
            aria-label={c.rawAccordionTitle}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => syncGrezzoFromState(active)}>
              {c.restoreGrezzo}
            </Button>
            <Button type="button" size="sm" className="rounded-xl" onClick={applyGrezzo}>
              {c.applyGrezzo}
            </Button>
          </div>
        </details>

        {workItemId ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={saving}
              className="sm:mr-auto"
              onClick={() => router.push(`/listing-generazione?workItemId=${workItemId}`)}
            >
              {c.back}
            </Button>
            <Button type="button" variant="secondary" size="sm" disabled={saving} onClick={() => void saveDraft()}>
              {c.saveDraft}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              className="rounded-xl bg-emerald-700 px-4 text-white shadow-sm hover:bg-emerald-800"
              onClick={() => void saveProject()}
            >
              {c.saveProject}
            </Button>
            {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-amber-800">Apri questa pagina da un work item con parametro workItemId.</p>
        )}
      </section>
    </main>
  );
}

export default function BriefCreativoPage() {
  return (
    <Suspense
      fallback={
        <main className="p-8">
          <p className="text-sm text-slate-600">{it.common.loading}</p>
        </main>
      }
    >
      <BriefCreativoInner />
    </Suspense>
  );
}
