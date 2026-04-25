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

  return (
    <section className="surface-card rounded-4xl p-6 sm:p-8 space-y-5">
      <h2 className="text-lg font-semibold text-slate-900">{k.finalPlan.title}</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.finalPlan.primary}</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{plan.keyword_primaria_finale || k.finalPlan.empty}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.finalPlan.secondary}</p>
          {renderPills(plan.keyword_secondarie_prioritarie)}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.finalPlan.frontend}</p>
          {renderPills(plan.parole_da_spingere_nel_frontend)}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.finalPlan.backend}</p>
          {renderPills(plan.parole_da_tenere_per_backend)}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k.finalPlan.excludedFinal}</p>
        {renderPills(excludedKeywords)}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">{k.finalPlan.impactTitle}</h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-700">
          <li>
            <span className="font-medium">{k.finalPlan.impactTitleLabel}:</span> {plan.keyword_primaria_finale || k.finalPlan.empty}
          </li>
          <li>
            <span className="font-medium">{k.finalPlan.impactBulletsDescriptionLabel}:</span>{" "}
            {plan.parole_da_spingere_nel_frontend.slice(0, 8).join(", ") || k.finalPlan.empty}
          </li>
          <li>
            <span className="font-medium">{k.finalPlan.impactBackendLabel}:</span>{" "}
            {plan.parole_da_tenere_per_backend.slice(0, 12).join(", ") || k.finalPlan.empty}
          </li>
        </ul>
      </div>
    </section>
  );
}
