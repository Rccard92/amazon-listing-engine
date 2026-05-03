"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { it } from "@/lib/i18n/it";
import type { WorkItem } from "@/lib/work-items";

type WorkItemCardProps = {
  item: WorkItem;
  onOpen?: (item: WorkItem) => void;
  onDuplicate?: (item: WorkItem) => void;
  onDelete?: (item: WorkItem) => void;
  onMoveToProject?: (item: WorkItem) => void;
};

function workflowLabel(type: WorkItem["workflow_type"]): string {
  if (type === "new_listing") return "Nuova scheda prodotto";
  if (type === "improve_listing") return "Migliora scheda esistente";
  return "Analisi competitor";
}

function statusLabel(status: WorkItem["status"]): string {
  if (status === "completed") return "Progetto confermato";
  if (status === "in_progress") return "In corso";
  return "Bozza";
}

export function WorkItemCard({ item, onOpen, onDuplicate, onDelete, onMoveToProject }: WorkItemCardProps) {
  return (
    <Card className="border-slate-200/80">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{item.title}</CardTitle>
          <Badge variant={item.status === "completed" ? "success" : item.status === "in_progress" ? "info" : "neutral"}>
            {statusLabel(item.status)}
          </Badge>
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{workflowLabel(item.workflow_type)}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-slate-600">{item.summary || "Nessun riepilogo disponibile."}</p>
        <p className="text-xs text-slate-500">
          Aggiornato: {new Date(item.updated_at).toLocaleString("it-IT")}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => onOpen?.(item)}>
          {it.common.open}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDuplicate?.(item)}>
          {it.common.duplicate}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onMoveToProject?.(item)}>
          {it.common.moveToProject}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete?.(item)}>
          {it.common.delete}
        </Button>
      </CardFooter>
    </Card>
  );
}

