import { buildApiUrl } from "@/lib/api";

export type CreativeBriefArea = "gallery" | "a_plus" | "faq";

export const CREATIVE_BRIEF_GALLERY_KEY = "creative_brief_gallery" as const;
export const CREATIVE_BRIEF_A_PLUS_KEY = "creative_brief_a_plus" as const;
export const CREATIVE_BRIEF_FAQ_KEY = "creative_brief_faq" as const;

export const CREATIVE_BRIEF_SCHEMA_V2 = "v2";

/** Blocco legacy (solo `body`) o misto. */
export type CreativeBriefBlock = {
  body?: string;
  updated_at?: string;
  schema_version?: string;
  legacy_body?: string;
  common_specs?: string;
  images?: CreativeBriefGalleryImage[];
  modules?: CreativeBriefAPlusModule[];
  faqs?: CreativeBriefFaqItem[];
};

export type CreativeBriefGalleryImage = {
  title: string;
  role: string;
  visual_instructions: string;
  short_message: string;
  communication_angle: string;
  designer_instructions: string;
  mistakes_to_avoid: string;
  product_data_to_highlight: string;
};

export type CreativeBriefGalleryPayload = {
  common_specs: string;
  images: CreativeBriefGalleryImage[];
};

export type CreativeBriefAPlusModule = {
  title: string;
  dimensions: string;
  visual_objective: string;
  what_to_show: string;
  suggested_text: string;
  layout_guidance: string;
  elements_to_highlight: string;
  mistakes_to_avoid: string;
  product_data_to_use?: string;
};

export type CreativeBriefAPlusPayload = {
  modules: CreativeBriefAPlusModule[];
};

export type CreativeBriefFaqItem = {
  question: string;
  answer: string;
};

export type CreativeBriefFaqPayload = {
  faqs: CreativeBriefFaqItem[];
};

export type CreativeBriefGenerateResponse = {
  area: CreativeBriefArea;
  updated_at: string;
  schema_version?: string;
  gallery?: CreativeBriefGalleryPayload | null;
  a_plus?: CreativeBriefAPlusPayload | null;
  faq?: CreativeBriefFaqPayload | null;
  legacy_body?: string | null;
  parse_warning?: string | null;
  raw_model_text?: string | null;
};

type PipelineErrorDetail = {
  error_code?: string;
  message_it?: string;
  details?: string;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object" && !Array.isArray(x);
}

function parseJsonObject(raw: string): unknown | null {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** @deprecated Usa normalizeGalleryFromStored */
export function readCreativeBriefBody(generatedOutput: Record<string, unknown> | undefined, key: string): string {
  if (!generatedOutput) return "";
  const block = generatedOutput[key];
  if (block && typeof block === "object" && !Array.isArray(block) && "body" in block) {
    return String((block as CreativeBriefBlock).body ?? "");
  }
  return "";
}

export function normalizeGalleryFromStored(block: unknown): {
  structured: CreativeBriefGalleryPayload | null;
  legacyBody: string;
  updatedAt?: string;
} {
  if (!isRecord(block)) return { structured: null, legacyBody: "" };
  const updatedAt = typeof block.updated_at === "string" ? block.updated_at : undefined;

  if (
    block.schema_version === CREATIVE_BRIEF_SCHEMA_V2 &&
    typeof block.common_specs === "string" &&
    Array.isArray(block.images) &&
    block.images.length === 8
  ) {
    return {
      structured: {
        common_specs: block.common_specs,
        images: block.images as CreativeBriefGalleryImage[],
      },
      legacyBody: typeof block.legacy_body === "string" ? block.legacy_body : "",
      updatedAt,
    };
  }

  if (typeof block.body === "string" && block.body.trim().startsWith("{")) {
    const parsed = parseJsonObject(block.body);
    if (
      isRecord(parsed) &&
      typeof parsed.common_specs === "string" &&
      Array.isArray(parsed.images) &&
      parsed.images.length === 8
    ) {
      return {
        structured: {
          common_specs: parsed.common_specs,
          images: parsed.images as CreativeBriefGalleryImage[],
        },
        legacyBody: "",
        updatedAt,
      };
    }
  }

  if (typeof block.body === "string") {
    return { structured: null, legacyBody: block.body, updatedAt };
  }
  return { structured: null, legacyBody: "", updatedAt };
}

export function normalizeAPlusFromStored(block: unknown): {
  structured: CreativeBriefAPlusPayload | null;
  legacyBody: string;
  updatedAt?: string;
} {
  if (!isRecord(block)) return { structured: null, legacyBody: "" };
  const updatedAt = typeof block.updated_at === "string" ? block.updated_at : undefined;

  if (
    block.schema_version === CREATIVE_BRIEF_SCHEMA_V2 &&
    Array.isArray(block.modules) &&
    block.modules.length === 3
  ) {
    return {
      structured: { modules: block.modules as CreativeBriefAPlusModule[] },
      legacyBody: typeof block.legacy_body === "string" ? block.legacy_body : "",
      updatedAt,
    };
  }

  if (typeof block.body === "string" && block.body.trim().startsWith("{")) {
    const parsed = parseJsonObject(block.body);
    if (isRecord(parsed) && Array.isArray(parsed.modules) && parsed.modules.length === 3) {
      return {
        structured: { modules: parsed.modules as CreativeBriefAPlusModule[] },
        legacyBody: "",
        updatedAt,
      };
    }
  }

  if (typeof block.body === "string") {
    return { structured: null, legacyBody: block.body, updatedAt };
  }
  return { structured: null, legacyBody: "", updatedAt };
}

export function normalizeFaqFromStored(block: unknown): {
  structured: CreativeBriefFaqPayload | null;
  legacyBody: string;
  updatedAt?: string;
} {
  if (!isRecord(block)) return { structured: null, legacyBody: "" };
  const updatedAt = typeof block.updated_at === "string" ? block.updated_at : undefined;

  if (
    block.schema_version === CREATIVE_BRIEF_SCHEMA_V2 &&
    Array.isArray(block.faqs) &&
    block.faqs.length === 5
  ) {
    return {
      structured: { faqs: block.faqs as CreativeBriefFaqItem[] },
      legacyBody: typeof block.legacy_body === "string" ? block.legacy_body : "",
      updatedAt,
    };
  }

  if (typeof block.body === "string" && block.body.trim().startsWith("{")) {
    const parsed = parseJsonObject(block.body);
    if (isRecord(parsed) && Array.isArray(parsed.faqs) && parsed.faqs.length === 5) {
      return {
        structured: { faqs: parsed.faqs as CreativeBriefFaqItem[] },
        legacyBody: "",
        updatedAt,
      };
    }
  }

  if (typeof block.body === "string") {
    return { structured: null, legacyBody: block.body, updatedAt };
  }
  return { structured: null, legacyBody: "", updatedAt };
}

export function hasAreaContent(
  structured: CreativeBriefGalleryPayload | CreativeBriefAPlusPayload | CreativeBriefFaqPayload | null,
  legacyBody: string,
): boolean {
  return structured !== null || legacyBody.trim().length > 0;
}

export type ClipboardLabelsGallery = {
  commonSpecs: string;
  role: string;
  visualInstructions: string;
  shortMessage: string;
  communicationAngle: string;
  designerInstructions: string;
  mistakesToAvoid: string;
  productData: string;
};

export type ClipboardLabelsAPlus = {
  dimensions: string;
  visualObjective: string;
  whatToShow: string;
  suggestedText: string;
  layoutGuidance: string;
  elementsToHighlight: string;
  mistakesToAvoid: string;
  productData: string;
};

export function serializeGalleryForClipboard(data: CreativeBriefGalleryPayload, labels: ClipboardLabelsGallery): string {
  const lines: string[] = [`${labels.commonSpecs}\n${data.common_specs}`, ""];
  for (const img of data.images) {
    lines.push(
      img.title,
      `${labels.role} ${img.role}`,
      `${labels.visualInstructions} ${img.visual_instructions}`,
      `${labels.shortMessage} ${img.short_message}`,
      `${labels.communicationAngle} ${img.communication_angle}`,
      `${labels.designerInstructions} ${img.designer_instructions}`,
      `${labels.mistakesToAvoid} ${img.mistakes_to_avoid}`,
      `${labels.productData} ${img.product_data_to_highlight}`,
      "",
    );
  }
  return lines.join("\n").trim();
}

export function serializeAPlusForClipboard(data: CreativeBriefAPlusPayload, labels: ClipboardLabelsAPlus): string {
  const lines: string[] = [];
  for (const m of data.modules) {
    lines.push(
      m.title,
      `${labels.dimensions} ${m.dimensions}`,
      `${labels.visualObjective} ${m.visual_objective}`,
      `${labels.whatToShow} ${m.what_to_show}`,
      `${labels.suggestedText} ${m.suggested_text}`,
      `${labels.layoutGuidance} ${m.layout_guidance}`,
      `${labels.elementsToHighlight} ${m.elements_to_highlight}`,
      `${labels.mistakesToAvoid} ${m.mistakes_to_avoid}`,
      `${labels.productData} ${m.product_data_to_use ?? ""}`,
      "",
    );
  }
  return lines.join("\n").trim();
}

export function serializeFaqForClipboard(data: CreativeBriefFaqPayload, questionLabel: string, answerLabel: string): string {
  const lines: string[] = [];
  data.faqs.forEach((f, i) => {
    lines.push(`FAQ ${i + 1}`, `${questionLabel} ${f.question}`, `${answerLabel} ${f.answer}`, "");
  });
  return lines.join("\n").trim();
}

export function buildGalleryStorage(
  structured: CreativeBriefGalleryPayload | null,
  legacyBody: string,
  updatedAt: string,
): Record<string, unknown> {
  if (structured) {
    const o: Record<string, unknown> = {
      schema_version: CREATIVE_BRIEF_SCHEMA_V2,
      common_specs: structured.common_specs,
      images: structured.images,
      updated_at: updatedAt,
    };
    if (legacyBody.trim()) o.legacy_body = legacyBody.trim();
    return o;
  }
  return { body: legacyBody, updated_at: updatedAt };
}

export function buildAPlusStorage(
  structured: CreativeBriefAPlusPayload | null,
  legacyBody: string,
  updatedAt: string,
): Record<string, unknown> {
  if (structured) {
    const o: Record<string, unknown> = {
      schema_version: CREATIVE_BRIEF_SCHEMA_V2,
      modules: structured.modules,
      updated_at: updatedAt,
    };
    if (legacyBody.trim()) o.legacy_body = legacyBody.trim();
    return o;
  }
  return { body: legacyBody, updated_at: updatedAt };
}

export function buildFaqStorage(
  structured: CreativeBriefFaqPayload | null,
  legacyBody: string,
  updatedAt: string,
): Record<string, unknown> {
  if (structured) {
    const o: Record<string, unknown> = {
      schema_version: CREATIVE_BRIEF_SCHEMA_V2,
      faqs: structured.faqs,
      updated_at: updatedAt,
    };
    if (legacyBody.trim()) o.legacy_body = legacyBody.trim();
    return o;
  }
  return { body: legacyBody, updated_at: updatedAt };
}

/** Prova ad applicare testo grezzo (JSON) all area attiva; ritorna messaggio errore o null. */
export function tryApplyGrezzoJson(
  area: CreativeBriefArea,
  text: string,
): { ok: true; gallery?: CreativeBriefGalleryPayload; a_plus?: CreativeBriefAPlusPayload; faq?: CreativeBriefFaqPayload } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) {
    return { ok: false, error: "Il contenuto non sembra JSON (manca { iniziale)." };
  }
  const parsed = parseJsonObject(trimmed);
  if (!isRecord(parsed)) {
    return { ok: false, error: "JSON non valido." };
  }
  if (area === "gallery") {
    if (typeof parsed.common_specs !== "string" || !Array.isArray(parsed.images) || parsed.images.length !== 8) {
      return { ok: false, error: "Atteso: common_specs stringa e images con 8 elementi." };
    }
    return {
      ok: true,
      gallery: { common_specs: parsed.common_specs, images: parsed.images as CreativeBriefGalleryImage[] },
    };
  }
  if (area === "a_plus") {
    if (!Array.isArray(parsed.modules) || parsed.modules.length !== 3) {
      return { ok: false, error: "Atteso: modules con 3 elementi." };
    }
    return { ok: true, a_plus: { modules: parsed.modules as CreativeBriefAPlusModule[] } };
  }
  if (!Array.isArray(parsed.faqs) || parsed.faqs.length !== 5) {
    return { ok: false, error: "Atteso: faqs con 5 elementi." };
  }
  return { ok: true, faq: { faqs: parsed.faqs as CreativeBriefFaqItem[] } };
}

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
  { ok: true; data: CreativeBriefGenerateResponse } | { ok: false; status: number; error: PipelineErrorDetail | null }
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
