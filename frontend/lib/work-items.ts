import { getApiBaseUrl } from "@/lib/api";

export type WorkflowType = "new_listing" | "improve_listing" | "competitor_analysis";
export type WorkItemStatus = "draft" | "in_progress" | "completed";

export type WorkItem = {
  id: string;
  title: string;
  workflow_type: WorkflowType;
  status: WorkItemStatus;
  source_url: string | null;
  competitor_url: string | null;
  summary: string | null;
  input_data: Record<string, unknown>;
  keyword_data: Record<string, unknown>;
  generated_output: Record<string, unknown>;
  project_folder_id: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkItemCreatePayload = {
  title: string;
  workflow_type: WorkflowType;
  status?: WorkItemStatus;
  source_url?: string | null;
  competitor_url?: string | null;
  summary?: string | null;
  input_data?: Record<string, unknown>;
  keyword_data?: Record<string, unknown>;
  generated_output?: Record<string, unknown>;
  project_folder_id?: string | null;
};

export type WorkItemUpdatePayload = Partial<WorkItemCreatePayload>;

export async function listHistory(): Promise<WorkItem[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/history`, { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as WorkItem[];
}

export async function listWorkItems(projectFolderId?: string): Promise<WorkItem[]> {
  const url = new URL(`${getApiBaseUrl()}/api/v1/work-items`);
  if (projectFolderId) url.searchParams.set("project_folder_id", projectFolderId);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as WorkItem[];
}

export async function getWorkItem(itemId: string): Promise<WorkItem | null> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/work-items/${itemId}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as WorkItem;
}

export async function createWorkItem(payload: WorkItemCreatePayload): Promise<WorkItem | null> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/work-items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return (await res.json()) as WorkItem;
}

export async function updateWorkItem(itemId: string, payload: WorkItemUpdatePayload): Promise<WorkItem | null> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/work-items/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return (await res.json()) as WorkItem;
}

export async function duplicateWorkItem(itemId: string): Promise<WorkItem | null> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/work-items/${itemId}/duplicate`, {
    method: "POST",
  });
  if (!res.ok) return null;
  return (await res.json()) as WorkItem;
}

export async function deleteWorkItem(itemId: string): Promise<boolean> {
  const res = await fetch(`${getApiBaseUrl()}/api/v1/work-items/${itemId}`, { method: "DELETE" });
  return res.status === 204;
}

