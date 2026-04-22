import { buildApiUrl } from "@/lib/api";

export type ListingSectionType = "seo_title" | "bullet_points" | "description" | "keyword_strategy";

export type PriceTier = "entry" | "mid" | "premium" | "unknown";

export type ConfirmedProductStrategy = {
  nome_prodotto: string;
  categoria: string | null;
  caratteristiche_tecniche: string[];
  benefici_principali: string[];
  usp_differenziazione: string | null;
  target_cliente: string | null;
  gestione_obiezioni: string[];
  insight_recensioni_clienti: string | null;
  keyword_primarie: string[];
  keyword_secondarie: string[];
  linee_guida_brand: string | null;
  angolo_emotivo: string | null;
  livello_prezzo: PriceTier;
};

export type ValidationSeverity = "error" | "warning" | "info";

export type ValidationIssue = {
  code: string;
  severity: ValidationSeverity;
  message_it: string;
  field?: string | null;
};

export type ValidationReport = {
  issues: ValidationIssue[];
};

export type InjectedRules = {
  amazon_constraints?: string | null;
  brand_guidelines?: string | null;
  banned_phrases?: string[];
  seo_title_max_chars?: number | null;
  description_max_chars?: number | null;
  description_min_chars?: number | null;
  backend_search_terms_max_bytes?: number | null;
};

export type GenerateListingSectionRequest = {
  strategy: ConfirmedProductStrategy;
  section: ListingSectionType;
  rules?: InjectedRules | null;
  include_raw_model_text?: boolean;
};

export type ListingSectionResult = {
  section: ListingSectionType;
  seo_title?: string | null;
  bullets?: string[] | null;
  description?: string | null;
  backend_search_terms?: string | null;
  raw_model_text?: string | null;
  validation: ValidationReport;
  post_processing_applied: string[];
};

export type PipelineErrorDetail = {
  error_code: string;
  message_it: string;
  details?: string | null;
};

export type GenerateSectionResult =
  | { ok: true; data: ListingSectionResult }
  | { ok: false; status: number; error: PipelineErrorDetail | null };

function parsePipelineError(detail: unknown): PipelineErrorDetail | null {
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

export async function generateListingSection(
  payload: GenerateListingSectionRequest,
): Promise<GenerateSectionResult> {
  const res = await fetch(buildApiUrl("/api/v1/listing-generation/generate"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      strategy: payload.strategy,
      section: payload.section,
      rules: payload.rules ?? null,
      include_raw_model_text: payload.include_raw_model_text ?? false,
    }),
  });
  const rawText = await res.text();
  let body: unknown = null;
  try {
    body = rawText ? JSON.parse(rawText) : null;
  } catch {
    body = null;
  }
  if (!res.ok) {
    return { ok: false, status: res.status, error: parsePipelineError(body) };
  }
  return { ok: true, data: body as ListingSectionResult };
}

/** Allineato a `MANUAL_PRODUCT_STRATEGY_KEY` nel backend (`WorkItem.input_data`). */
export const MANUAL_PRODUCT_STRATEGY_KEY = "manual_product_strategy" as const;

/** Costruisce la strategia confermata dal form "nuova scheda" (MVP manuale-first). */
export function buildManualProductStrategyFromNewListingForm(args: {
  productName: string;
  category: string;
  benefits: string;
  manualKeywords: string;
}): ConfirmedProductStrategy {
  const benefitLines = args.benefits
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const kwRaw = args.manualKeywords
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const cut = kwRaw.length <= 1 ? kwRaw.length : Math.max(1, Math.ceil(kwRaw.length / 2));
  const primarie = kwRaw.slice(0, cut);
  const secondarie = kwRaw.slice(cut);
  return {
    nome_prodotto: args.productName.trim() || "Da completare",
    categoria: args.category.trim() || null,
    caratteristiche_tecniche: [],
    benefici_principali: benefitLines,
    usp_differenziazione: null,
    target_cliente: null,
    gestione_obiezioni: [],
    insight_recensioni_clienti: null,
    keyword_primarie: primarie,
    keyword_secondarie: secondarie,
    linee_guida_brand: null,
    angolo_emotivo: null,
    livello_prezzo: "unknown",
  };
}

export async function getConfirmedStrategyFromWorkItem(workItemId: string): Promise<ConfirmedProductStrategy | null> {
  const res = await fetch(buildApiUrl(`/api/v1/listing-generation/confirmed-strategy/${workItemId}`), {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as ConfirmedProductStrategy;
}

export function emptyStrategy(): ConfirmedProductStrategy {
  return {
    nome_prodotto: "",
    categoria: null,
    caratteristiche_tecniche: [],
    benefici_principali: [],
    usp_differenziazione: null,
    target_cliente: null,
    gestione_obiezioni: [],
    insight_recensioni_clienti: null,
    keyword_primarie: [],
    keyword_secondarie: [],
    linee_guida_brand: null,
    angolo_emotivo: null,
    livello_prezzo: "unknown",
  };
}
