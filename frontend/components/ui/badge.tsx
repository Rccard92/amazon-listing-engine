import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "success" | "warning" | "info";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70",
  warning: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
  info: "bg-sky-50 text-sky-800 ring-1 ring-sky-200/70",
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

