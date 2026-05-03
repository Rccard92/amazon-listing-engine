"use client";

import { Button } from "@/components/ui/button";
import type { CreativeBriefFaqPayload } from "@/lib/creative-brief";
import { it } from "@/lib/i18n/it";

const c = it.creativeBrief;

type Props = {
  data: CreativeBriefFaqPayload;
  onCopyFaq?: (index: number, text: string) => void;
};

export function FaqBriefView({ data, onCopyFaq }: Props) {
  const lb = c.labels.faq;
  return (
    <div className="space-y-4">
      {data.faqs.map((f, i) => (
        <article
          key={`faq-${i}`}
          className="surface-card rounded-2xl p-5 sm:p-6 shadow-sm space-y-3 border border-slate-100/80"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {lb.cardTitle} {i + 1}
            </h3>
            {onCopyFaq ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={() =>
                  onCopyFaq(i, `${lb.question} ${f.question}\n${lb.answer} ${f.answer}`)
                }
              >
                {c.copyFaq}
              </Button>
            ) : null}
          </div>
          <p>
            <strong className="font-semibold text-slate-800">{lb.question}</strong>
            <span className="mt-1 block text-sm leading-relaxed text-slate-700">{f.question}</span>
          </p>
          <p>
            <strong className="font-semibold text-slate-800">{lb.answer}</strong>
            <span className="mt-1 block text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{f.answer}</span>
          </p>
        </article>
      ))}
    </div>
  );
}
