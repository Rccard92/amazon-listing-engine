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

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">{k.finalPlan.includedTitle}</p>
        <p className="mt-1 text-xs text-emerald-800">{k.finalPlan.includedHint}</p>
        {!activeKeywords.length ? (
          <p className="mt-3 text-sm text-emerald-900/80">{k.finalPlan.empty}</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeKeywords.map((item) => (
              <KeywordChip key={`${item.keyword}-${item.origin}-inc`} item={item} onAction={onExcludeKeyword} actionLabel="-" />
            ))}
          </div>
        )}
      </div>

      {verifyKeywords.length ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">{k.finalPlan.verify}</p>
          <p className="mt-1 text-xs text-amber-900/90">{k.finalPlan.verifyHint}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {verifyKeywords.map((item) => (
              <span key={item} className="rounded-xl bg-white px-3 py-1 text-xs text-amber-900">
                {item}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <button
          type="button"
          onClick={() => setShowExcluded((value) => !value)}
          className="flex w-full items-center justify-between text-left"
        >
          <span>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">{k.finalPlan.excludedTitle}</span>
            {excludedKeywords.length ? (
              <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                {excludedKeywords.length}
              </span>
            ) : null}
          </span>
          <span className="text-xs font-medium text-slate-500">{showExcluded ? k.finalPlan.hideExcluded : k.finalPlan.showExcluded}</span>
        </button>
        <p className="mt-1 text-xs text-slate-500">{k.finalPlan.excludedHint}</p>
        {showExcluded && excludedKeywords.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {excludedKeywords.map((item) => (
              <span
                key={`${item.keyword}-${item.origin}-ex`}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1 text-xs text-slate-700 ring-1 ring-slate-200/80"
              >
                <span>{item.keyword}</span>
                <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {item.origin === "manual" ? k.finalPlan.originManual : k.finalPlan.originAi}
                </span>
                <button
                  type="button"
                  onClick={() => onRestoreKeyword(item.keyword)}
                  className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                >
                  {k.finalPlan.restore}
                </button>
              </span>
            ))}
          </div>
        ) : null}
        {showExcluded && !excludedKeywords.length ? (
          <p className="mt-3 text-sm text-slate-500">{k.finalPlan.noExcluded}</p>
        ) : null}
      </div>
    </section>
  );
}
