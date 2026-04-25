"use client";

import { it } from "@/lib/i18n/it";
import type { KeywordClassificationItem } from "@/lib/listing-generation";

type KeywordDecisionsBoardProps = {
  items: KeywordClassificationItem[];
};

const k = it.keywordIntelligence;

function mapUsageLabel(usage: KeywordClassificationItem["recommended_usage"]): string {
  if (usage === "title") return "Title";
  if (usage === "bullets_description") return "Bullets/Description";
  if (usage === "backend_search_terms") return "Backend keywords";
  if (usage === "verify") return "Verifica";
  return "Escludi";
}

function groupItems(items: KeywordClassificationItem[]) {
  return {
    accepted: items.filter((item) =>
      ["PRIMARY_SEO", "SECONDARY_SEO", "FEATURE_KEYWORD", "LONG_TAIL", "BACKEND_ONLY", "PPC_EXACT", "PPC_PHRASE"].includes(
        item.category,
      ),
    ),
    excluded: items.filter((item) => ["OFF_TARGET", "NEGATIVE_KEYWORD"].includes(item.category)),
    verify: items.filter((item) => item.category === "VERIFY_PRODUCT_FEATURE"),
    competitor: items.filter((item) => item.category === "BRANDED_COMPETITOR"),
  };
}

function DecisionCard({ title, items }: { title: string; items: KeywordClassificationItem[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{items.length} keyword</p>
      {!items.length ? (
        <p className="mt-3 text-sm text-slate-500">{k.decisions.none}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <article key={`${title}-${item.keyword}`} className="rounded-xl border border-slate-200/80 p-3">
              <p className="text-sm font-medium text-slate-900">{item.keyword}</p>
              <dl className="mt-2 grid gap-1 text-xs text-slate-600">
                <div>
                  <dt className="inline font-semibold">{k.decisions.category}: </dt>
                  <dd className="inline">{item.category}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">{k.decisions.priority}: </dt>
                  <dd className="inline">{item.priority}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">{k.decisions.usage}: </dt>
                  <dd className="inline">{mapUsageLabel(item.recommended_usage)}</dd>
                </div>
                <div>
                  <dt className="inline font-semibold">{k.decisions.reason}: </dt>
                  <dd className="inline">{item.rationale}</dd>
                </div>
                {item.excluded_reason_type ? (
                  <div>
                    <dt className="inline font-semibold">Tipo esclusione: </dt>
                    <dd className="inline">{item.excluded_reason_type}</dd>
                  </div>
                ) : null}
                {item.required_user_confirmation ? (
                  <div className="font-semibold text-amber-700">{k.decisions.requiredConfirmation}</div>
                ) : null}
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function KeywordDecisionsBoard({ items }: KeywordDecisionsBoardProps) {
  const groups = groupItems(items);
  return (
    <section className="surface-card rounded-4xl p-6 sm:p-8 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{k.decisions.title}</h2>
        <p className="mt-1 text-sm text-slate-600">{k.decisions.subtitle}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <DecisionCard title={k.decisions.accepted} items={groups.accepted} />
        <DecisionCard title={k.decisions.excluded} items={groups.excluded} />
        <DecisionCard title={k.decisions.verify} items={groups.verify} />
        <DecisionCard title={k.decisions.competitor} items={groups.competitor} />
      </div>
    </section>
  );
}
