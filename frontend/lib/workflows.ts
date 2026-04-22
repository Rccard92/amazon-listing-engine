import { buildApiUrl } from "@/lib/api";
import type { WorkItem } from "@/lib/work-items";

export type SimilarFieldClass = "auto_extracted" | "ai_suggested" | "user_required" | "user_confirmation";

export type SimilarField = {
  key: string;
  label: string;
  value: string | string[] | number | null;
  field_class: SimilarFieldClass;
  needs_confirmation: boolean;
};

export type CreateFromSimilarResponse = {
  normalized_url: string;
  parser_used: string;
  warnings: string[];
  fields: SimilarField[];
  work_item: WorkItem;
};

export async function createFromSimilar(payload: {
  competitor_url: string;
  work_item_id?: string | null;
  user_required?: Record<string, unknown>;
  user_confirmation?: Record<string, unknown>;
}): Promise<CreateFromSimilarResponse | null> {
  const res = await fetch(buildApiUrl("/api/v1/workflows/create-from-similar"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return null;
  return (await res.json()) as CreateFromSimilarResponse;
}

