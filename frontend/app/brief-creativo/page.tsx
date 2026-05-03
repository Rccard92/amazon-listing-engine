"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CREATIVE_BRIEF_A_PLUS_KEY,
  CREATIVE_BRIEF_FAQ_KEY,
  CREATIVE_BRIEF_GALLERY_KEY,
  generateCreativeBrief,
  readCreativeBriefBody,
  type CreativeBriefArea,
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

function BriefCreativoInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workItemId = searchParams.get("workItemId");

  const [active, setActive] = useState<CreativeBriefArea>("gallery");
  const [galleryText, setGalleryText] = useState("");
  const [aPlusText, setAPlusText] = useState("");
  const [faqText, setFaqText] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [workItemStatus, setWorkItemStatus] = useState<WorkItemStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!workItemId) return;
      const item = await getWorkItem(workItemId);
      if (cancelled || !item) return;
      const go = item.generated_output as Record<string, unknown>;
      setGalleryText(readCreativeBriefBody(go, CREATIVE_BRIEF_GALLERY_KEY));
      setAPlusText(readCreativeBriefBody(go, CREATIVE_BRIEF_A_PLUS_KEY));
      setFaqText(readCreativeBriefBody(go, CREATIVE_BRIEF_FAQ_KEY));
      setWorkItemStatus(item.status);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [workItemId]);

  function textForArea(area: CreativeBriefArea): string {
    if (area === "gallery") return galleryText;
    if (area === "a_plus") return aPlusText;
    return faqText;
  }

  function setTextForArea(area: CreativeBriefArea, value: string) {
    if (area === "gallery") setGalleryText(value);
    else if (area === "a_plus") setAPlusText(value);
    else setFaqText(value);
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
    setTextForArea(area, res.data.body);
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
        [CREATIVE_BRIEF_GALLERY_KEY]: { body: galleryText, updated_at: now },
        [CREATIVE_BRIEF_A_PLUS_KEY]: { body: aPlusText, updated_at: now },
        [CREATIVE_BRIEF_FAQ_KEY]: { body: faqText, updated_at: now },
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
        [CREATIVE_BRIEF_GALLERY_KEY]: { body: galleryText, updated_at: now },
        [CREATIVE_BRIEF_A_PLUS_KEY]: { body: aPlusText, updated_at: now },
        [CREATIVE_BRIEF_FAQ_KEY]: { body: faqText, updated_at: now },
      },
      status: "completed",
    });
    setWorkItemStatus("completed");
    setSaving(false);
    setHint(c.savedProject);
  }

  async function copyActive() {
    const t = textForArea(active);
    if (!t.trim()) return;
    await navigator.clipboard.writeText(t);
    setCopyFeedback(c.copied);
    setTimeout(() => setCopyFeedback(null), 2000);
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
            {textForArea(active).trim() ? c.regenerate : c.generate}
          </Button>
          <Button type="button" variant="secondary" disabled={!textForArea(active).trim()} onClick={() => void copyActive()}>
            {c.copy}
          </Button>
          {busy ? <span className="text-sm text-slate-500">{c.loading}</span> : null}
          {copyFeedback ? <span className="text-sm text-emerald-700">{copyFeedback}</span> : null}
        </div>

        <Textarea
          className="mt-4 min-h-[320px] rounded-2xl text-sm leading-relaxed"
          value={textForArea(active)}
          onChange={(e) => setTextForArea(active, e.target.value)}
          placeholder={c.placeholder}
          aria-label={activeTab.label}
        />

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
