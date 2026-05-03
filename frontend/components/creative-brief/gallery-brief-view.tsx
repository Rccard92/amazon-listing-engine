"use client";

import type { CreativeBriefGalleryPayload } from "@/lib/creative-brief";
import { it } from "@/lib/i18n/it";

const c = it.creativeBrief;

type Props = {
  data: CreativeBriefGalleryPayload;
};

export function GalleryBriefView({ data }: Props) {
  const lb = c.labels.gallery;
  return (
    <div className="space-y-4">
      <div className="surface-card rounded-2xl p-5 sm:p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.commonSpecsBanner}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{data.common_specs}</p>
      </div>
      <div className="space-y-3">
        {data.images.map((img, i) => (
          <article
            key={`${img.title}-${i}`}
            className="surface-card rounded-2xl p-5 sm:p-6 shadow-sm space-y-3 border border-slate-100/80"
          >
            <h3 className="text-base font-semibold text-slate-900">{img.title}</h3>
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <strong className="font-semibold text-slate-800">{lb.role}</strong>
                <span className="mt-1 block leading-relaxed">{img.role}</span>
              </p>
              <p>
                <strong className="font-semibold text-slate-800">{lb.visualInstructions}</strong>
                <span className="mt-1 block leading-relaxed whitespace-pre-wrap">{img.visual_instructions}</span>
              </p>
              <p>
                <strong className="font-semibold text-slate-800">{lb.shortMessage}</strong>
                <span className="mt-1 block leading-relaxed">{img.short_message}</span>
              </p>
              <p>
                <strong className="font-semibold text-slate-800">{lb.communicationAngle}</strong>
                <span className="mt-1 block leading-relaxed">{img.communication_angle}</span>
              </p>
              <p>
                <strong className="font-semibold text-slate-800">{lb.designerInstructions}</strong>
                <span className="mt-1 block leading-relaxed whitespace-pre-wrap">{img.designer_instructions}</span>
              </p>
              <p>
                <strong className="font-semibold text-slate-800">{lb.mistakesToAvoid}</strong>
                <span className="mt-1 block leading-relaxed whitespace-pre-wrap">{img.mistakes_to_avoid}</span>
              </p>
              <p>
                <strong className="font-semibold text-slate-800">{lb.productData}</strong>
                <span className="mt-1 block leading-relaxed whitespace-pre-wrap">{img.product_data_to_highlight}</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
