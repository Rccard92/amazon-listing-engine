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

export type WorkflowErrorDetail = {
  error_code: string;
  message_it: string;
  details?: string | null;
};

export type ProductStrategyDraft = {
  normalized_product_name: string;
  category: string | null;
  technical_features: string[];
  main_benefits: string[];
  strengths: string[];
  probable_usp: string | null;
  probable_target_customer: string | null;
  probable_objections: string[];
  evident_keywords: string[];
  inferred_price_tier: "entry" | "mid" | "premium" | "unknown";
  emotional_angle: string | null;
  brand_tone_detected: string | null;
  user_confirmation_fields: string[];
  missing_information: string[];
  confidence_notes: string[];
};

export type CreateFromSimilarResponse = {
  normalized_url: string;
  parser_used: string;
  warnings: string[];
  extraction_status: "complete" | "partial" | "failed";
  allow_continue: boolean;
  ai_analysis: ProductStrategyDraft | null;
  ai_error: WorkflowErrorDetail | null;
  fields: SimilarField[];
  work_item: WorkItem;
};

export type CreateFromSimilarResult =
  | { ok: true; data: CreateFromSimilarResponse }
  | { ok: false; status: number; error: WorkflowErrorDetail | null; rawDetail: unknown };

function parseErrorDetail(detail: unknown): WorkflowErrorDetail | null {
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) return null;
  const d = detail as Record<string, unknown>;
  const code = d.error_code;
  const msg = d.message_it;
  if (typeof code !== "string" || typeof msg !== "string") return null;
  const details = d.details;
  return {
    error_code: code,
    message_it: msg,
    details: details === null || typeof details === "string" ? (details as string | null) : String(details),
  };
}

export async function createFromSimilar(payload: {
  competitor_url: string;
  work_item_id?: string | null;
  user_required?: Record<string, unknown>;
  user_confirmation?: Record<string, unknown>;
}): Promise<CreateFromSimilarResult> {
  const res = await fetch(buildApiUrl("/api/v1/workflows/create-from-similar"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const rawText = await res.text();
  let body: unknown = null;
  if (rawText) {
    try {
      body = JSON.parse(rawText) as unknown;
    } catch {
      body = rawText;
    }
  }

  if (!res.ok) {
    const detail =
      body && typeof body === "object" && body !== null && "detail" in body
        ? (body as { detail: unknown }).detail
        : null;
    const structured = parseErrorDetail(detail);
    if (structured) {
      return { ok: false, status: res.status, error: structured, rawDetail: detail };
    }
    if (typeof detail === "string") {
      return {
        ok: false,
        status: res.status,
        error: { error_code: "UNKNOWN", message_it: detail, details: null },
        rawDetail: detail,
      };
    }
    return { ok: false, status: res.status, error: null, rawDetail: detail };
  }

  return { ok: true, data: body as CreateFromSimilarResponse };
}

