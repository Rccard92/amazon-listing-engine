"use client";

import { useCallback, useEffect, useState } from "react";

import { WorkItemList } from "@/components/history/work-item-list";
import { it } from "@/lib/i18n/it";
import { listHistory, type WorkItem } from "@/lib/work-items";

export default function HistoryPage() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await listHistory();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{it.history.title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{it.history.subtitle}</p>
      </header>
      {loading ? <p className="text-sm text-slate-500">{it.common.loading}</p> : <WorkItemList items={items} onRefresh={refresh} />}
    </main>
  );
}

