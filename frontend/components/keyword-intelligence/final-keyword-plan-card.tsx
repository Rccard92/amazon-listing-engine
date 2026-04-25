"use client";

import { useState } from "react";

import { it } from "@/lib/i18n/it";
import type { AdjustedKeywordItem, ConfirmedKeywordPlan } from "@/lib/listing-generation";

type FinalKeywordPlanCardProps = {
  plan: ConfirmedKeywordPlan;
  activeKeywords: AdjustedKeywordItem[];
  excludedKeywords: AdjustedKeywordItem[];
  onExcludeKeyword: (keyword: string) => void;
  onRestoreKeyword: (keyword: string) => void;
  onAddKeyword: (keyword: string) => void;
};

const k = it.keywordIntelligence;

function KeywordChip({
  item,
  onAction,
  actionLabel,
}: {
  item: AdjustedKeywordItem;
  onAction: (keyword: string) => void;
  actionLabel: string;
}): JSX.Element {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1 text-xs text-slate-700">
      <span>{item.keyword}</span>
      <span className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600">
        {item.origin === "manual" ? k.finalPlan.originManual : k.finalPlan.originAi}
      </span>
      <button
        type="button"
        onClick={() => onAction(item.keyword)}
        aria-label={`${actionLabel} ${item.keyword}`}
        className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
      >
        {actionLabel}
      </button>
    </span>
  );
}

export function FinalKeywordPlanCard({
  plan,
  activeKeywords,
  excludedKeywords,
  onExcludeKeyword,
  onRestoreKeyword,
  onAddKeyword,
}: FinalKeywordPlanCardProps) {
  const [newKeyword, setNewKeyword] = useState("");
  const [showExcluded, setShowExcluded] = useState(false);
  const verifyKeywords = plan.classificazioni_confermate
    .filter((item) => item.category === "VERIFY_PRODUCT_FEATURE" || item.required_user_confirmation)
    .map((item) => item.keyword);

  const activeFrontend = activeKeywords.filter((item) => item.channel === "frontend" || item.channel === "both");
  const frontendCore = activeFrontend.slice(0, 8);
  const frontendSupport = activeFrontend.slice(8);
  const activeBackend = activeKeywords.filter((item) => item.channel === "backend" || item.channel === "both");
  const backendCopyValue = activeBackend.map((item) => item.keyword).join(" ");

  function handleAddKeyword() {
    const keyword = newKeyword.trim();
    if (!keyword) return;
    onAddKeyword(keyword);
    setNewKeyword("");
  }

  return (
    <section className="surface-card rounded-4xl p-6 sm:p-8 space-y-5">
      <h2 className="text-lg font-semibold text-slate-900">{k.finalPlan.title}</h2>
      <p className="text-sm text-slate-600">{k.finalPlan.summaryHint}</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.finalPlan.addManualTitle}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder={k.finalPlan.addManualPlaceholder}
            className="min-w-64 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
          />
          <button
            type="button"
            onClick={handleAddKeyword}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            {k.finalPlan.addManualAction}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">{k.finalPlan.primary}</p>
        <p className="mt-2 text-sm font-semibold text-emerald-950">{plan.keyword_primaria_finale || k.finalPlan.empty}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.finalPlan.frontendCore}</p>
          {!frontendCore.length ? (
            <p className="mt-2 text-sm text-slate-500">{k.finalPlan.empty}</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {frontendCore.map((item) => (
                <KeywordChip key={`${item.keyword}-${item.origin}-core`} item={item} onAction={onExcludeKeyword} actionLabel="-" />
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.finalPlan.frontendSupport}</p>
          {!frontendSupport.length ? (
            <p className="mt-2 text-sm text-slate-500">{k.finalPlan.empty}</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {frontendSupport.map((item) => (
                <KeywordChip key={`${item.keyword}-${item.origin}-support`} item={item} onAction={onExcludeKeyword} actionLabel="-" />
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.finalPlan.backendFinal}</p>
          {!activeBackend.length ? (
            <p className="mt-2 text-sm text-slate-500">{k.finalPlan.empty}</p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {activeBackend.map((item) => (
                <KeywordChip key={`${item.keyword}-${item.origin}-backend`} item={item} onAction={onExcludeKeyword} actionLabel="-" />
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500">{k.finalPlan.backendCopyHint}</p>
          <textarea
            readOnly
            value={backendCopyValue}
            className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
          />
        </div>
        {verifyKeywords.length ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">{k.finalPlan.verify}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {verifyKeywords.map((item) => (
                <span key={item} className="rounded-xl bg-white px-3 py-1 text-xs text-amber-900">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {excludedKeywords.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <button
            type="button"
            onClick={() => setShowExcluded((value) => !value)}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            {showExcluded ? k.finalPlan.hideExcluded : k.finalPlan.showExcluded}
          </button>
          {showExcluded ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {excludedKeywords.map((item) => (
                <span key={`${item.keyword}-${item.origin}-excluded`} className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  <span>{item.keyword}</span>
                  <span className="rounded-lg bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600">
                    {item.origin === "manual" ? k.finalPlan.originManual : k.finalPlan.originAi}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRestoreKeyword(item.keyword)}
                    className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    {k.finalPlan.restore}
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
