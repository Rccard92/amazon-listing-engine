"use client";

import { useCallback, useEffect, useState } from "react";

import { ProjectFolderCard } from "@/components/projects/project-folder-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/workflow/empty-state";
import { it } from "@/lib/i18n/it";
import {
  createProjectFolder,
  deleteProjectFolder,
  listProjectFolders,
  type ProjectFolder,
  updateProjectFolder,
} from "@/lib/project-folders";

export default function ProjectsPage() {
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await listProjectFolders();
    setFolders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleCreate() {
    const name = window.prompt(it.projects.projectNameLabel, it.projects.projectNamePlaceholder);
    if (!name) return;
    await createProjectFolder({ name: name.trim() });
    await refresh();
  }

  async function handleRename(folder: ProjectFolder) {
    const next = window.prompt(it.common.rename, folder.name);
    if (!next || !next.trim()) return;
    await updateProjectFolder(folder.id, { name: next.trim() });
    await refresh();
  }

  async function handleDelete(folder: ProjectFolder) {
    const ok = window.confirm(`Eliminare il progetto "${folder.name}"?`);
    if (!ok) return;
    await deleteProjectFolder(folder.id);
    await refresh();
  }

  return (
    <main className="space-y-6">
      <header className="surface-card rounded-4xl p-8 sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{it.projects.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{it.projects.subtitle}</p>
          </div>
          <Button type="button" onClick={handleCreate}>
            {it.common.createProject}
          </Button>
        </div>
      </header>

      {loading ? <p className="text-sm text-slate-500">{it.common.loading}</p> : null}

      {!loading && folders.length === 0 ? (
        <EmptyState title={it.projects.emptyTitle} description={it.projects.emptyBody} />
      ) : null}

      {!loading && folders.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {folders.map((folder) => (
            <ProjectFolderCard
              key={folder.id}
              folder={folder}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : null}
    </main>
  );
}

