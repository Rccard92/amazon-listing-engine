"use client";

import { AiTracePanel } from "@/components/ai-trace/ai-trace-panel";
import { it } from "@/lib/i18n/it";
import type { AiDebugTrace } from "@/lib/listing-generation";

type DebugTraceCollapsibleProps = {
  trace: AiDebugTrace | null | undefined;
};

const k = it.keywordIntelligence;

export function DebugTraceCollapsible({ trace }: DebugTraceCollapsibleProps) {
  return (
    <section className="surface-card rounded-4xl p-6 sm:p-8">
      <details>
        <summary className="cursor-pointer list-none">
          <span className="text-lg font-semibold text-slate-900">{k.debugTitle}</span>
          <p className="mt-1 text-sm text-slate-600">{k.debugHint}</p>
        </summary>
        <div className="mt-4">
          <AiTracePanel trace={trace} />
        </div>
      </details>
    </section>
  );
}
