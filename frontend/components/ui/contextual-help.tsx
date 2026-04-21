"use client";

import * as Popover from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

export type ContextualHelpProps = {
  title: string;
  body: string;
  triggerLabel?: string;
};

/**
 * Aiuto contestuale accessibile: si apre con click/tap (mobile) oltre che da tastiera.
 * Usa Radix Popover per evitare dipendenza solo dall'hover.
 */
export function ContextualHelp({ title, body, triggerLabel = "Apri spiegazione" }: ContextualHelpProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
            "border border-slate-200/90 bg-white text-xs font-semibold text-slate-600 shadow-sm",
            "transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15",
          )}
          aria-label={triggerLabel}
        >
          ?
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className={cn(
            "z-50 max-w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card outline-none",
          )}
          sideOffset={8}
          collisionPadding={16}
        >
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
