"use client";

import * as React from "react";
import { useId } from "react";

import { ContextualHelp } from "@/components/ui/contextual-help";
import { it } from "@/lib/i18n/it";
import { cn } from "@/lib/utils";

export type FormFieldHelp = {
  title: string;
  body: string;
  triggerLabel?: string;
};

type FormFieldProps = {
  label: string;
  hint?: string;
  example?: string;
  help?: FormFieldHelp;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
};

function mergeDescribedBy(existing: string | undefined, add: string | undefined) {
  if (!existing && !add) return undefined;
  return [existing, add].filter(Boolean).join(" ").trim() || undefined;
}

export function FormField({
  label,
  hint,
  example,
  help,
  required,
  optional,
  children,
  className,
}: FormFieldProps) {
  const baseId = useId();
  const fieldId = `${baseId}-field`;
  const hintId = hint ? `${baseId}-hint` : undefined;
  const exampleId = example ? `${baseId}-example` : undefined;
  const describedBy = mergeDescribedBy(undefined, [hintId, exampleId].filter(Boolean).join(" ") || undefined);

  let resolvedId = fieldId;
  if (React.isValidElement(children) && (children.props as { id?: string }).id) {
    resolvedId = (children.props as { id?: string }).id as string;
  }

  const control = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
        id: resolvedId,
        "aria-required": required ? true : undefined,
        "aria-describedby": mergeDescribedBy(
          (children.props as { "aria-describedby"?: string })["aria-describedby"],
          describedBy,
        ),
      })
    : children;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="field-label mb-0" htmlFor={resolvedId}>
          {label}
        </label>
        {required ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {it.common.required}
          </span>
        ) : null}
        {optional && !required ? (
          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
            {it.common.optional}
          </span>
        ) : null}
        {help ? (
          <ContextualHelp
            title={help.title}
            body={help.body}
            triggerLabel={help.triggerLabel ?? `Aiuto: ${label}`}
          />
        ) : null}
      </div>
      {control}
      {hint ? (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      ) : null}
      {example ? (
        <p id={exampleId} className="text-xs text-slate-500">
          <span className="font-medium text-slate-600">{it.common.examplePrefix}</span> {example}
        </p>
      ) : null}
    </div>
  );
}
