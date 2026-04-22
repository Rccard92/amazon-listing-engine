import { buildApiUrl } from "@/lib/api";

export type ProjectFolder = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  items_count?: number;
  last_item_updated_at?: string | null;
};

export type ProjectFolderCreatePayload = {
  name: string;
  description?: string | null;
};

export async function listProjectFolders(): Promise<ProjectFolder[]> {
  const res = await fetch(buildApiUrl("/api/v1/projects"), { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as ProjectFolder[];
}

export async function createProjectFolder(payload: ProjectFolderCreatePayload): Promise<ProjectFolder | null> {
  const res = await fetch(buildApiUrl("/api/v1/projects"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return (await res.json()) as ProjectFolder;
}

export async function updateProjectFolder(
  projectId: string,
  payload: Partial<ProjectFolderCreatePayload>,
): Promise<ProjectFolder | null> {
  const res = await fetch(buildApiUrl(`/api/v1/projects/${projectId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return (await res.json()) as ProjectFolder;
}

export async function deleteProjectFolder(projectId: string): Promise<boolean> {
  const res = await fetch(buildApiUrl(`/api/v1/projects/${projectId}`), { method: "DELETE" });
  return res.status === 204;
}

