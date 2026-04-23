import { getApiBaseUrl } from "@/lib/api";

import type { NextRequest } from "next/server";

function buildTargetUrl(req: NextRequest, path: string[]): string {
  const backendBase = getApiBaseUrl().replace(/\/+$/, "");
  const joinedPath = path.map((segment) => encodeURIComponent(segment)).join("/");
  const target = new URL(`${backendBase}/${joinedPath}`);
  req.nextUrl.searchParams.forEach((value, key) => {
    target.searchParams.append(key, value);
  });
  return target.toString();
}

async function proxyRequest(req: NextRequest, path: string[]): Promise<Response> {
  const targetUrl = buildTargetUrl(req, path);
  const method = req.method.toUpperCase();
  const incomingHeaders = new Headers(req.headers);
  incomingHeaders.delete("host");

  const init: RequestInit = {
    method,
    headers: incomingHeaders,
    cache: "no-store",
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(method)) {
    init.body = await req.text();
  }

  const upstream = await fetch(targetUrl, init);
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path } = await context.params;
  return proxyRequest(req, path);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path } = await context.params;
  return proxyRequest(req, path);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path } = await context.params;
  return proxyRequest(req, path);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path } = await context.params;
  return proxyRequest(req, path);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path } = await context.params;
  return proxyRequest(req, path);
}

