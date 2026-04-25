"use client";

import { useMemo, useState } from "react";

import { it } from "@/lib/i18n/it";
import type { KeywordClassificationItem } from "@/lib/listing-generation";

type KeywordDecisionsBoardProps = {
  items: KeywordClassificationItem[];
};

const k = it.keywordIntelligence;

function mapReasonLabel(item: KeywordClassificationItem): string {
  if (item.excluded_reason_type === "competitor_brand") return k.decisions.reasons.competitorBrand;
  if (item.excluded_reason_type === "wrong_product_type") return k.decisions.reasons.wrongProductType;
  if (item.excluded_reason_type === "unsupported_feature") return k.decisions.reasons.unsupportedFeature;
  if (item.excluded_reason_type === "too_ambiguous") return k.decisions.reasons.tooAmbiguous;
  if (item.excluded_reason_type === "irrelevant_intent") return k.decisions.reasons.irrelevantIntent;
  if (item.excluded_reason_type === "off_target") return k.decisions.reasons.offTarget;
  if (item.category === "BRANDED_COMPETITOR") return k.decisions.reasons.competitorBrand;
  if (item.category === "OFF_TARGET") return k.decisions.reasons.offTarget;
  return item.rationale || k.decisions.reasons.generic;
}

function simpleGroups(items: KeywordClassificationItem[]) {
  const content = items.filter((item) =>
    ["PRIMARY_SEO", "SECONDARY_SEO", "FEATURE_KEYWORD", "LONG_TAIL"].includes(item.category),
  );
  const backend = items.filter((item) =>
    ["BACKEND_ONLY", "PPC_EXACT", "PPC_PHRASE", "LONG_TAIL"].includes(item.category) ||
    item.recommended_usage === "backend_search_terms",
  );
  const verify = items.filter(
    (item) => item.category === "VERIFY_PRODUCT_FEATURE" || item.required_user_confirmation,
  );
  const excluded = items.filter((item) =>
    ["OFF_TARGET", "NEGATIVE_KEYWORD", "BRANDED_COMPETITOR"].includes(item.category) ||
    item.recommended_usage === "exclude",
  );
  const core = content.filter((item) => item.category === "PRIMARY_SEO" || item.category === "FEATURE_KEYWORD");
  const support = content.filter((item) => !core.some((coreItem) => coreItem.keyword === item.keyword));
  return { core, support, backend, verify, excluded };
}

function Pills({ items }: { items: string[] }) {
  if (!items.length) return <p className="mt-2 text-sm text-slate-500">{k.decisions.none}</p>;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-xl bg-slate-100 px-3 py-1 text-xs text-slate-700">
          {item}
        </span>
      ))}
    </div>
  );
}

export function KeywordDecisionsBoard({ items }: KeywordDecisionsBoardProps) {
  const [showDebug, setShowDebug] = useState(false);
  const groups = useMemo(() => simpleGroups(items), [items]);
  const excludedRows = groups.excluded.map((item) => ({
    keyword: item.keyword,
    reason: mapReasonLabel(item),
  }));
  const verifyRows = groups.verify.map((item) => ({
    keyword: item.keyword,
    reason: item.rationale || k.decisions.verifyHint,
  }));

  return (
    <section className="surface-card rounded-4xl p-6 sm:p-8 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{k.decisions.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{k.decisions.subtitle}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">{k.decisions.contentKeywords}</h3>
          <p className="mt-1 text-xs text-slate-500">{k.decisions.coreKeywords}</p>
          <Pills items={groups.core.map((item) => item.keyword)} />
          <p className="mt-3 text-xs text-slate-500">{k.decisions.supportKeywords}</p>
          <Pills items={groups.support.map((item) => item.keyword)} />
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">{k.decisions.backendKeywords}</h3>
          <p className="mt-1 text-xs text-slate-500">{k.decisions.backendHint}</p>
          <Pills items={groups.backend.map((item) => item.keyword)} />
        </article>
      </div>

      {verifyRows.length ? (
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">{k.decisions.verify}</h3>
          <div className="mt-2 space-y-2">
            {verifyRows.map((row) => (
              <p key={row.keyword} className="text-sm text-amber-900">
                <span className="font-semibold">{row.keyword}</span> - {row.reason}
              </p>
            ))}
          </div>
        </article>
      ) : null}

      {excludedRows.length ? (
        <article className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <h3 className="text-sm font-semibold text-rose-900">{k.decisions.excluded}</h3>
          <div className="mt-2 space-y-2">
            {excludedRows.map((row) => (
              <p key={row.keyword} className="text-sm text-rose-900">
                <span className="font-semibold">{row.keyword}</span> - {row.reason}
              </p>
            ))}
          </div>
        </article>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <button
          type="button"
          onClick={() => setShowDebug((value) => !value)}
          className="text-xs font-semibold uppercase tracking-wide text-slate-600"
        >
          {showDebug ? k.decisions.hideDebug : k.decisions.showDebug}
        </button>
        {showDebug ? (
          <div className="mt-3 space-y-2">
            {items.map((item) => (
              <p key={`${item.keyword}-${item.category}`} className="text-xs text-slate-600">
                {item.keyword} | {item.category} | {item.priority} | {item.recommended_usage}
              </p>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
