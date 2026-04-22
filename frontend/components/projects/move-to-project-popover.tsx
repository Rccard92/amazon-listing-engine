"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { it } from "@/lib/i18n/it";
import { createProjectFolder, listProjectFolders } from "@/lib/project-folders";
import { updateWorkItem } from "@/lib/work-items";

type MoveToProjectPopoverProps = {
  workItemId: string;
  currentProjectId?: string | null;
  compact?: boolean;
  onDone?: () => void;
};

export function MoveToProjectPopover({
  workItemId,
  currentProjectId = null,
  compact = false,
  onDone,
}: MoveToProjectPopoverProps) {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState<string>(currentProjectId ?? "");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);

  const hasProjects = useMemo(() => projects.length > 0, [projects]);

  async function ensureProjectsLoaded() {
    if (projects.length > 0) return;
    const data = await listProjectFolders();
    setProjects(data.map((p) => ({ id: p.id, name: p.name })));
  }

  async function moveToExisting() {
    if (!projectId) return;
    setLoading(true);
    await updateWorkItem(workItemId, { project_folder_id: projectId });
    setLoading(false);
    setOpen(false);
    onDone?.();
  }

  async function createAndMove() {
    if (!newName.trim()) return;
    setLoading(true);
    const created = await createProjectFolder({ name: newName.trim() });
    if (created) {
      await updateWorkItem(workItemId, { project_folder_id: created.id });
    }
    setLoading(false);
    setOpen(false);
    setNewName("");
    onDone?.();
  }

  return (
    <div>
      <Button
        size={compact ? "sm" : "md"}
        variant="secondary"
        type="button"
        onClick={async () => {
          await ensureProjectsLoaded();
          setOpen((s) => !s);
        }}
      >
        {it.common.moveToProject}
      </Button>
      {open ? (
        <Card className="mt-3 border-slate-200/80">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-800">Seleziona un progetto esistente</p>
              {hasProjects ? (
                <select
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-800"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">Seleziona...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-slate-500">Nessun progetto disponibile.</p>
              )}
              <Button size="sm" type="button" onClick={moveToExisting} disabled={!projectId || loading}>
                {it.common.moveToProject}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-800">{it.common.createProject}</p>
              <Input
                placeholder={it.projects.projectNamePlaceholder}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Button size="sm" type="button" onClick={createAndMove} disabled={!newName.trim() || loading}>
                {it.common.createAndMove}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

