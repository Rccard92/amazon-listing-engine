import { buildApiUrl } from "@/lib/api";

export type CreativeBriefArea = "gallery" | "a_plus" | "faq";

export const CREATIVE_BRIEF_GALLERY_KEY = "creative_brief_gallery" as const;
export const CREATIVE_BRIEF_A_PLUS_KEY = "creative_brief_a_plus" as const;
export const CREATIVE_BRIEF_FAQ_KEY = "creative_brief_faq" as const;

export type CreativeBriefBlock = {
  body: string;
  updated_at?: string;
};

export type CreativeBriefGenerateResponse = {
  area: CreativeBriefArea;
  body: string;
  updated_at: string;
  raw_model_text?: string | null;
};

type PipelineErrorDetail = {
  error_code?: string;
  message_it?: string;
  details?: string;
};

function parseError(body: unknown): PipelineErrorDetail | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const d = body as Record<string, unknown>;
  const detail = d.detail;
  if (detail && typeof detail === "object" && !Array.isArray(detail)) {
    return detail as PipelineErrorDetail;
  }
  return null;
}

export async function generateCreativeBrief(
  workItemId: string,
  area: CreativeBriefArea,
): Promise<
  | { ok: true; data: CreativeBriefGenerateResponse }
  | { ok: false; status: number; error: PipelineErrorDetail | null }
> {
  const res = await fetch(buildApiUrl("/api/v1/creative-brief/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ work_item_id: workItemId, area, include_raw_model_text: false }),
  });
  const rawText = await res.text();
  let body: unknown = null;
  try {
    body = rawText ? JSON.parse(rawText) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    return { ok: false, status: res.status, error: parseError(body) };
  }
  return { ok: true, data: body as CreativeBriefGenerateResponse };
}

export function readCreativeBriefBody(generatedOutput: Record<string, unknown> | undefined, key: string): string {
  if (!generatedOutput) return "";
  const block = generatedOutput[key];
  if (block && typeof block === "object" && !Array.isArray(block) && "body" in block) {
    return String((block as CreativeBriefBlock).body ?? "");
  }
  return "";
}
