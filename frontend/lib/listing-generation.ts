import { buildApiUrl } from "@/lib/api";

export type ListingSectionType = "seo_title" | "bullet_points" | "description" | "keyword_strategy";

export type PriceTier = "entry" | "mid" | "premium" | "unknown";

/** Fase 1 — allineato a `ProductBrief` backend. */
export type ProductBrief = {
  nome_prodotto: string;
  categoria: string | null;
  brand: string;
  descrizione_attuale: string | null;
  bullet_attuali: string[];
  caratteristiche_specifiche: string[];
  dettagli_articolo: string | null;
  dettagli_aggiuntivi: string | null;
  riassunto_ai_recensioni: string | null;
  keyword_primarie: string[];
  keyword_secondarie: string[];
  livello_prezzo: PriceTier;
  linee_guida_brand: string | null;
  note_utente: string | null;
};

/** Fase 2 — allineato a `StrategicEnrichment` backend. */
export type StrategicEnrichment = {
  benefici_principali: string[];
  usp_differenziazione: string | null;
  target_cliente: string | null;
  gestione_obiezioni: string[];
  angolo_emotivo: string | null;
  enrichment_provenance?: string | null;
};

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

export const PRODUCT_BRIEF_KEY = "product_brief" as const;
export const STRATEGIC_ENRICHMENT_KEY = "strategic_enrichment" as const;
/** Legacy: strategia flat salvata prima del brief strutturato. */
export const MANUAL_PRODUCT_STRATEGY_KEY = "manual_product_strategy" as const;
export const DEFAULT_BRAND = "Meridiana";

function parsePipelineError(detail: unknown): PipelineErrorDetail | null {
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) return null;
  const root = detail as Record<string, unknown>;
  const wrapped = root.detail;
  const d =
    wrapped && typeof wrapped === "object" && !Array.isArray(wrapped)
      ? (wrapped as Record<string, unknown>)
      : root;
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

export function emptyProductBrief(): ProductBrief {
  return {
    nome_prodotto: "",
    categoria: null,
    brand: DEFAULT_BRAND,
    descrizione_attuale: null,
    bullet_attuali: [],
    caratteristiche_specifiche: [],
    dettagli_articolo: null,
    dettagli_aggiuntivi: null,
    riassunto_ai_recensioni: null,
    keyword_primarie: [],
    keyword_secondarie: [],
    livello_prezzo: "unknown",
    linee_guida_brand: null,
    note_utente: null,
  };
}

export function emptyStrategicEnrichment(): StrategicEnrichment {
  return {
    benefici_principali: [],
    usp_differenziazione: null,
    target_cliente: null,
    gestione_obiezioni: [],
    angolo_emotivo: null,
    enrichment_provenance: undefined,
  };
}

/** Migrazione on-read da strategia confermata legacy (un solo blocco). */
export function migrateLegacyManualToBriefAndEnrichment(raw: Record<string, unknown>): {
  brief: ProductBrief;
  enrichment: StrategicEnrichment;
} | null {
  const mps = raw[MANUAL_PRODUCT_STRATEGY_KEY];
  if (!mps || typeof mps !== "object" || Array.isArray(mps)) return null;
  if (raw[PRODUCT_BRIEF_KEY]) return null;
  const c = mps as ConfirmedProductStrategy;
  return {
    brief: {
      nome_prodotto: c.nome_prodotto || "",
      categoria: c.categoria,
      brand: DEFAULT_BRAND,
      descrizione_attuale: null,
      bullet_attuali: [],
      caratteristiche_specifiche: [...(c.caratteristiche_tecniche || [])],
      dettagli_articolo: null,
      dettagli_aggiuntivi: null,
      riassunto_ai_recensioni: c.insight_recensioni_clienti,
      keyword_primarie: [...(c.keyword_primarie || [])],
      keyword_secondarie: [...(c.keyword_secondarie || [])],
      livello_prezzo: c.livello_prezzo || "unknown",
      linee_guida_brand: c.linee_guida_brand,
      note_utente: null,
    },
    enrichment: {
      benefici_principali: [...(c.benefici_principali || [])],
      usp_differenziazione: c.usp_differenziazione,
      target_cliente: c.target_cliente,
      gestione_obiezioni: [...(c.gestione_obiezioni || [])],
      angolo_emotivo: c.angolo_emotivo,
      enrichment_provenance: "manual",
    },
  };
}

export async function requestStrategicEnrichment(productBrief: ProductBrief): Promise<
  | { ok: true; enrichment: StrategicEnrichment }
  | { ok: false; status: number; error: PipelineErrorDetail | null }
> {
  const res = await fetch(buildApiUrl("/api/v1/manual-workflow/enrich"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_brief: productBrief }),
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
  return { ok: true, enrichment: body as StrategicEnrichment };
}

export async function requestStrategicEnrichmentForWorkItem(workItemId: string): Promise<
  | { ok: true; enrichment: StrategicEnrichment }
  | { ok: false; status: number; error: PipelineErrorDetail | null }
> {
  const res = await fetch(buildApiUrl(`/api/v1/manual-workflow/enrich-work-item/${workItemId}`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
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
  return { ok: true, enrichment: body as StrategicEnrichment };
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
