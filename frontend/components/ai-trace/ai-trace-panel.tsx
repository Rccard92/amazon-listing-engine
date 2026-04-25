"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { AiDebugTrace } from "@/lib/listing-generation";

type Props = {
  trace: AiDebugTrace | null | undefined;
  title?: string;
  toggleLabel?: string;
  emptyLabel?: string;
};

export function AiTracePanel({
  trace,
  title = "Analisi AI dettagliata",
  toggleLabel = "Mostra Traccia AI",
  emptyLabel = "Nessuna traccia AI disponibile per questa esecuzione.",
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
          {open ? "Nascondi Traccia AI" : toggleLabel}
        </Button>
      </div>
      {open ? (
        <div className="mt-3 space-y-3">
          {!trace ? (
            <p className="text-xs text-slate-600">{emptyLabel}</p>
          ) : (
            <>
              {trace.data.ui_blocks.length > 0 ? (
                <div className="grid gap-2">
                  {trace.data.ui_blocks.map((block, idx) => (
                    <div key={`${block.title}-${idx}`} className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{block.title}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{block.content}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {trace.data.decisions.length > 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Decisioni AI</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {trace.data.decisions.map((d, idx) => (
                      <li key={`${d.label}-${idx}`}>
                        <span className="font-medium">{d.label}:</span> {d.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {trace.data.validation_checks.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Controlli finali</p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-900">
                    {trace.data.validation_checks.map((v, idx) => (
                      <li key={`${v.code}-${idx}`}>
                        [{v.severity}] {v.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Riepilogo</p>
                <p className="mt-1 text-sm text-slate-700">{trace.summary || trace.data.reasoning_summary || "-"}</p>
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
