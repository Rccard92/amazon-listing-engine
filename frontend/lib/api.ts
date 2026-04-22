const defaultBase = "http://localhost:8000";

export function getApiBaseUrl(): string {
  return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
}

export function normalizeApiBaseUrl(raw?: string): string {
  const fallback = defaultBase;
  const value = (raw ?? "").trim();
  if (!value) return fallback;

  // Se manca schema (es. backend-domain), forziamo https://
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    const normalizedPath = url.pathname.replace(/\/+$/, "");
    const path = normalizedPath === "/" ? "" : normalizedPath;
    return `${url.protocol}//${url.host}${path}`;
  } catch {
    return fallback;
  }
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${safePath}`;
}

export type HealthLive = {
  status: string;
  service: string;
};

export async function fetchHealthLive(): Promise<HealthLive | null> {
  const url = buildApiUrl("/api/v1/health");
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as HealthLive;
  } catch {
    return null;
  }
}
