"use client";

import { it } from "@/lib/i18n/it";
import type { ConfirmedKeywordPlan } from "@/lib/listing-generation";

type FinalKeywordPlanCardProps = {
  plan: ConfirmedKeywordPlan;
};

const k = it.keywordIntelligence;

function renderPills(values: string[]): JSX.Element {
  if (!values.length) return <p className="text-sm text-slate-500">{k.finalPlan.empty}</p>;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {values.map((value) => (
        <span key={value} className="rounded-xl bg-slate-100 px-3 py-1 text-xs text-slate-700">
          {value}
        </span>
      ))}
    </div>
  );
}

export function FinalKeywordPlanCard({ plan }: FinalKeywordPlanCardProps) {
  const excludedKeywords = plan.keyword_escluse_definitivamente.map((item) => `${item.keyword} (${item.excluded_reason_type ?? "n/a"})`);
  const verifyKeywords = plan.classificazioni_confermate
    .filter((item) => item.category === "VERIFY_PRODUCT_FEATURE" || item.required_user_confirmation)
    .map((item) => item.keyword);
  const blocked = new Set([...verifyKeywords, ...plan.keyword_escluse_definitivamente.map((item) => item.keyword)]);
  const frontendSafe = plan.parole_da_spingere_nel_frontend.filter((keyword) => !blocked.has(keyword));
  const frontendCore = plan.parole_da_spingere_nel_frontend.slice(0, 8);
  const frontendSupport = frontendSafe.slice(8);
  const backendSafe = plan.parole_da_tenere_per_backend.filter((keyword) => !blocked.has(keyword));

  return (
    <section className="surface-card rounded-4xl p-6 sm:p-8 space-y-5">
      <h2 className="text-lg font-semibold text-slate-900">{k.finalPlan.title}</h2>
      <p className="text-sm text-slate-600">{k.finalPlan.summaryHint}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.finalPlan.frontendCore}</p>
          {renderPills(frontendSafe.slice(0, 8).length ? frontendSafe.slice(0, 8) : frontendCore)}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.finalPlan.frontendSupport}</p>
          {renderPills(frontendSupport)}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.finalPlan.backendFinal}</p>
          {renderPills(backendSafe)}
        </div>
        {verifyKeywords.length ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">{k.finalPlan.verify}</p>
            {renderPills(verifyKeywords)}
          </div>
        ) : null}
      </div>

      {excludedKeywords.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.finalPlan.excludedFinal}</p>
          {renderPills(excludedKeywords)}
        </div>
      ) : null}
    </section>
  );
}
