"use client";

import { useRouter } from "next/navigation";

import { WorkItemCard } from "@/components/history/work-item-card";
import { MoveToProjectPopover } from "@/components/projects/move-to-project-popover";
import { EmptyState } from "@/components/workflow/empty-state";
import { it } from "@/lib/i18n/it";
import { deleteWorkItem, duplicateWorkItem, type WorkItem } from "@/lib/work-items";

type WorkItemListProps = {
  items: WorkItem[];
  onRefresh?: () => void;
};

export function WorkItemList({ items, onRefresh }: WorkItemListProps) {
  const router = useRouter();

  if (items.length === 0) {
    return <EmptyState title={it.history.emptyTitle} description={it.history.emptyBody} />;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">{it.history.moveHint}</p>
      {items.map((item) => (
        <div key={item.id} className="space-y-3">
          <WorkItemCard
            item={item}
            onOpen={(i) => router.push(`/${routeByWorkflow(i.workflow_type)}?workItemId=${i.id}`)}
            onDuplicate={async (i) => {
              await duplicateWorkItem(i.id);
              onRefresh?.();
            }}
            onDelete={async (i) => {
              await deleteWorkItem(i.id);
              onRefresh?.();
            }}
          />
          <MoveToProjectPopover
            workItemId={item.id}
            currentProjectId={item.project_folder_id}
            onDone={() => onRefresh?.()}
          />
        </div>
      ))}
    </div>
  );
}

function routeByWorkflow(type: WorkItem["workflow_type"]): string {
  if (type === "new_listing") return "new-listing";
  if (type === "improve_listing") return "improve";
  return "competitor";
}

