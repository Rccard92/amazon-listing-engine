"use client";

import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export type TabItem = {
  key: string;
  label: string;
  content: React.ReactNode;
};

type TabsProps = {
  items: TabItem[];
  defaultKey?: string;
  className?: string;
};

export function Tabs({ items, defaultKey, className }: TabsProps) {
  const fallback = items[0]?.key ?? "";
  const [active, setActive] = useState(defaultKey ?? fallback);

  const current = useMemo(
    () => items.find((item) => item.key === active) ?? items[0],
    [items, active],
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="inline-flex w-full flex-wrap gap-2 rounded-2xl bg-slate-100/80 p-1.5 sm:w-auto">
        {items.map((item) => {
          const isActive = item.key === current?.key;
          return (
            <button
              key={item.key}
              type="button"
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900",
              )}
              onClick={() => setActive(item.key)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5">{current?.content}</div>
    </div>
  );
}

