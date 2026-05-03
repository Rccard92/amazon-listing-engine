"use client";

import type { CreativeBriefAPlusPayload } from "@/lib/creative-brief";
import { it } from "@/lib/i18n/it";

const c = it.creativeBrief;

type Props = {
  data: CreativeBriefAPlusPayload;
};

export function APlusBriefView({ data }: Props) {
  const lb = c.labels.aPlus;
  return (
    <div className="space-y-3">
      {data.modules.map((m, i) => (
        <article
          key={`${m.title}-${i}`}
          className="surface-card rounded-2xl p-5 sm:p-6 shadow-sm space-y-3 border border-slate-100/80"
        >
          <h3 className="text-base font-semibold text-slate-900">{m.title}</h3>
          <div className="space-y-2 text-sm text-slate-700">
            <p>
              <strong className="font-semibold text-slate-800">{lb.dimensions}</strong>
              <span className="mt-1 block leading-relaxed">{m.dimensions}</span>
            </p>
            <p>
              <strong className="font-semibold text-slate-800">{lb.visualObjective}</strong>
              <span className="mt-1 block leading-relaxed whitespace-pre-wrap">{m.visual_objective}</span>
            </p>
            <p>
              <strong className="font-semibold text-slate-800">{lb.whatToShow}</strong>
              <span className="mt-1 block leading-relaxed whitespace-pre-wrap">{m.what_to_show}</span>
            </p>
            <p>
              <strong className="font-semibold text-slate-800">{lb.suggestedText}</strong>
              <span className="mt-1 block leading-relaxed">{m.suggested_text}</span>
            </p>
            <p>
              <strong className="font-semibold text-slate-800">{lb.layoutGuidance}</strong>
              <span className="mt-1 block leading-relaxed whitespace-pre-wrap">{m.layout_guidance}</span>
            </p>
            <p>
              <strong className="font-semibold text-slate-800">{lb.elementsToHighlight}</strong>
              <span className="mt-1 block leading-relaxed whitespace-pre-wrap">{m.elements_to_highlight}</span>
            </p>
            <p>
              <strong className="font-semibold text-slate-800">{lb.mistakesToAvoid}</strong>
              <span className="mt-1 block leading-relaxed whitespace-pre-wrap">{m.mistakes_to_avoid}</span>
            </p>
            <p>
              <strong className="font-semibold text-slate-800">{lb.productData}</strong>
              <span className="mt-1 block leading-relaxed whitespace-pre-wrap">{m.product_data_to_use ?? ""}</span>
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
