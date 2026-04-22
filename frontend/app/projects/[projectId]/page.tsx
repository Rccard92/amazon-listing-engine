"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { MoveToProjectPopover } from "@/components/projects/move-to-project-popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/workflow/empty-state";
import { it } from "@/lib/i18n/it";
import { listProjectFolders } from "@/lib/project-folders";
import { deleteWorkItem, duplicateWorkItem, listWorkItems, type WorkItem } from "@/lib/work-items";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [items, setItems] = useState<WorkItem[]>([]);
  const [projectName, setProjectName] = useState<string>(it.projects.title);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [allProjects, data] = await Promise.all([listProjectFolders(), listWorkItems(projectId)]);
    const folder = allProjects.find((p) => p.id === projectId);
    if (folder) setProjectName(folder.name);
    setItems(data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{projectName}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{it.projects.insideSubtitle}</p>
      </header>

      {loading ? <p className="text-sm text-slate-500">{it.common.loading}</p> : null}

      {!loading && items.length === 0 ? (
        <EmptyState title={it.projects.insideTitle} description={it.projects.noItemsInProject} />
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="border-slate-200/80">
              <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">{item.title}</CardTitle>
                <Badge variant="neutral">{item.workflow_type}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{item.summary || "Nessun riepilogo disponibile."}</p>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => router.push(`/${toRoute(item.workflow_type)}?workItemId=${item.id}`)}>
                  {it.common.open}
                </Button>
                <Button size="sm" variant="ghost" onClick={async () => { await duplicateWorkItem(item.id); await refresh(); }}>
                  {it.common.duplicate}
                </Button>
                <MoveToProjectPopover
                  workItemId={item.id}
                  currentProjectId={item.project_folder_id}
                  compact
                  onDone={refresh}
                />
                <Button size="sm" variant="ghost" onClick={async () => { await deleteWorkItem(item.id); await refresh(); }}>
                  {it.common.delete}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : null}
    </main>
  );
}

function toRoute(workflowType: WorkItem["workflow_type"]): string {
  if (workflowType === "new_listing") return "new-listing";
  if (workflowType === "improve_listing") return "improve";
  return "competitor";
}

