const defaultBase = "http://localhost:8000";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? defaultBase;
}

export type HealthLive = {
  status: string;
  service: string;
};

export async function fetchHealthLive(): Promise<HealthLive | null> {
  const url = `${getApiBaseUrl()}/api/v1/health`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as HealthLive;
  } catch {
    return null;
  }
}
