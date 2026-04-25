"use client";

import { it } from "@/lib/i18n/it";
import type { ProductIntelligenceProfile } from "@/lib/listing-generation";

type ProductInterpretationCardProps = {
  profile: ProductIntelligenceProfile;
  compact?: boolean;
};

const k = it.keywordIntelligence;

function renderPct(value: number): string {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return `${pct}%`;
}

function renderList(values: string[]): JSX.Element {
  if (!values.length) return <p className="text-sm text-slate-500">{k.interpretation.empty}</p>;
  return (
    <ul className="mt-2 space-y-1 text-sm text-slate-700">
      {values.map((value) => (
        <li key={value} className="rounded-xl bg-slate-100/80 px-3 py-2">
          {value}
        </li>
      ))}
    </ul>
  );
}

export function ProductInterpretationCard({ profile, compact = false }: ProductInterpretationCardProps) {
  const confirmedAttributes = profile.main_detected_attributes.slice(0, 10).map((item) => `${item.name}: ${item.value}`);

  return (
    <section className="surface-card rounded-4xl p-6 sm:p-8 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{k.interpretation.title}</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{k.interpretation.productDetected}</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{profile.product_detected || k.interpretation.empty}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{k.interpretation.categoryDetected}</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{profile.category_detected || k.interpretation.empty}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{k.interpretation.confidence}</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{renderPct(profile.confidence_score)}</p>
        </div>
      </div>
      {!compact ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{k.interpretation.confirmedAttributes}</h3>
            {renderList(confirmedAttributes)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{k.interpretation.excludedAttributes}</h3>
            {renderList(profile.excluded_attributes)}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{k.interpretation.uncertainAttributes}</h3>
            {renderList(profile.uncertain_attributes)}
          </div>
        </div>
      ) : null}
    </section>
  );
}
