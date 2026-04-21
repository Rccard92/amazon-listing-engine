"use client";

import { ContextualHelp } from "@/components/ui/contextual-help";
import type { FormFieldHelp } from "@/components/workflow/form-field";
import { cn } from "@/lib/utils";

type StepSectionProps = {
  step: number;
  title: string;
  description: string;
  intro?: string;
  sectionHelp?: FormFieldHelp;
  children: React.ReactNode;
  className?: string;
};

export function StepSection({
  step,
  title,
  description,
  intro,
  sectionHelp,
  children,
  className,
}: StepSectionProps) {
  return (
    <section className={cn("page-section", className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
          {step}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
            {sectionHelp ? (
              <ContextualHelp
                title={sectionHelp.title}
                body={sectionHelp.body}
                triggerLabel={sectionHelp.triggerLabel ?? `Aiuto sul passaggio: ${title}`}
              />
            ) : null}
          </div>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
      </div>
      {intro ? (
        <p className="mt-4 rounded-2xl border border-slate-200/70 bg-white/60 p-4 text-sm leading-relaxed text-slate-700 shadow-sm">
          {intro}
        </p>
      ) : null}
      <div className="pt-2">{children}</div>
    </section>
  );
}
