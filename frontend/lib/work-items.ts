import { buildApiUrl } from "@/lib/api";

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

export type ApiErrorDetail = {
  message: string;
  raw: unknown;
};

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: ApiErrorDetail };

async function safeParseJson(res: Response): Promise<unknown> {
  const rawText = await res.text();
  if (!rawText) return null;
  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    return rawText;
  }
}

function extractErrorMessage(payload: unknown): string {
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const root = payload as Record<string, unknown>;
    const detail = root.detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const formatted = detail
        .map((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return null;
          const e = item as Record<string, unknown>;
          const locRaw = Array.isArray(e.loc) ? e.loc : [];
          const loc = locRaw
            .map((x) => (typeof x === "string" || typeof x === "number" ? String(x) : ""))
            .filter(Boolean)
            .join(".");
          const msg = typeof e.msg === "string" ? e.msg : "";
          if (!loc && !msg) return null;
          return loc ? `${loc}: ${msg}` : msg;
        })
        .filter((x): x is string => Boolean(x));
      if (formatted.length > 0) return formatted.join(" | ");
    }
    if (typeof detail === "string" && detail.trim()) return detail;
    if (detail && typeof detail === "object" && !Array.isArray(detail)) {
      const d = detail as Record<string, unknown>;
      if (typeof d.message_it === "string" && d.message_it.trim()) return d.message_it;
      if (typeof d.message === "string" && d.message.trim()) return d.message;
      if (typeof d.error_code === "string" && d.error_code.trim()) return d.error_code;
    }
  }
  return "Errore API non specificato.";
}

export async function getWorkItemResult(itemId: string): Promise<ApiResult<WorkItem>> {
  const res = await fetch(buildApiUrl(`/api/v1/work-items/${itemId}`), { cache: "no-store" });
  const body = await safeParseJson(res);
  if (!res.ok) {
    return { ok: false, status: res.status, error: { message: extractErrorMessage(body), raw: body } };
  }
  return { ok: true, status: res.status, data: body as WorkItem };
}

export async function createWorkItemResult(payload: WorkItemCreatePayload): Promise<ApiResult<WorkItem>> {
  const res = await fetch(buildApiUrl("/api/v1/work-items"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await safeParseJson(res);
  if (!res.ok) {
    return { ok: false, status: res.status, error: { message: extractErrorMessage(body), raw: body } };
  }
  return { ok: true, status: res.status, data: body as WorkItem };
}

export async function updateWorkItemResult(itemId: string, payload: WorkItemUpdatePayload): Promise<ApiResult<WorkItem>> {
  const res = await fetch(buildApiUrl(`/api/v1/work-items/${itemId}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await safeParseJson(res);
  if (!res.ok) {
    return { ok: false, status: res.status, error: { message: extractErrorMessage(body), raw: body } };
  }
  return { ok: true, status: res.status, data: body as WorkItem };
}

export async function listHistory(): Promise<WorkItem[]> {
  const res = await fetch(buildApiUrl("/api/v1/history"), { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as WorkItem[];
}

export async function listWorkItems(projectFolderId?: string): Promise<WorkItem[]> {
  const url = new URL(buildApiUrl("/api/v1/work-items"));
  if (projectFolderId) url.searchParams.set("project_folder_id", projectFolderId);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()) as WorkItem[];
}

export async function getWorkItem(itemId: string): Promise<WorkItem | null> {
  const result = await getWorkItemResult(itemId);
  return result.ok ? result.data : null;
}

export async function createWorkItem(payload: WorkItemCreatePayload): Promise<WorkItem | null> {
  const result = await createWorkItemResult(payload);
  return result.ok ? result.data : null;
}

export async function updateWorkItem(itemId: string, payload: WorkItemUpdatePayload): Promise<WorkItem | null> {
  const result = await updateWorkItemResult(itemId, payload);
  return result.ok ? result.data : null;
}

export async function duplicateWorkItem(itemId: string): Promise<WorkItem | null> {
  const res = await fetch(buildApiUrl(`/api/v1/work-items/${itemId}/duplicate`), {
    method: "POST",
  });
  if (!res.ok) return null;
  return (await res.json()) as WorkItem;
}

export async function deleteWorkItem(itemId: string): Promise<boolean> {
  const res = await fetch(buildApiUrl(`/api/v1/work-items/${itemId}`), { method: "DELETE" });
  return res.status === 204;
}

