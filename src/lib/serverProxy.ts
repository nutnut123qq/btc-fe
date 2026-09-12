export const HOP_BY_HOP_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
]);

export interface ProxyOptions {
  customProxyHeader?: string;
  timeoutMs?: number;
  overrideBackendUrl?: string;
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}

export function getUpstreamBaseUrl(overrideUrl?: string): string {
  const rawUrl = overrideUrl ?? process.env.BACKEND_INTERNAL_URL;
  if (!rawUrl || !rawUrl.trim()) {
    if (process.env.VERCEL === "1") {
      throw new Error("BACKEND_INTERNAL_URL is not configured.");
    }
    return "http://127.0.0.1:5197";
  }

  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  const parsed = new URL(trimmed);
  if (process.env.VERCEL === "1" && parsed.protocol !== "https:") {
    throw new Error("Upstream URL must use HTTPS in Vercel environment.");
  }
  return trimmed;
}

export function sanitizePathSegments(segments: string[]): string[] {
  for (const segment of segments) {
    if (segment === ".." || segment === "." || segment.includes("/") || segment.includes("\\")) {
      throw new Error("Invalid path segment detected.");
    }
  }
  return segments;
}

export function filterForwardHeaders(headers: Headers): Headers {
  const filtered = new Headers();
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(lower) && !lower.startsWith("x-forwarded-")) {
      filtered.set(key, value);
    }
  });
  return filtered;
}

export function filterResponseHeaders(headers: Headers, proxyTag = "node"): Headers {
  const filtered = new Headers();
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!HOP_BY_HOP_HEADERS.has(lower) && lower !== "content-encoding") {
      filtered.set(key, value);
    }
  });
  filtered.set("x-btc-proxy", proxyTag);
  return filtered;
}

export async function proxyApiRequest(
  request: Request,
  pathSegments: string[],
  options: ProxyOptions = {}
): Promise<Response> {
  const proxyTag = options.customProxyHeader ?? "node";
  const timeoutMs = options.timeoutMs ?? 290_000;

  try {
    const upstreamBase = getUpstreamBaseUrl(options.overrideBackendUrl);
    const sanitizedPath = sanitizePathSegments(pathSegments).map(encodeURIComponent).join("/");
    const incomingUrl = new URL(request.url);
    const targetUrl = new URL(`${upstreamBase}/api/${sanitizedPath}`);
    targetUrl.search = incomingUrl.search;

    const method = request.method.toUpperCase();
    const forwardHeaders = filterForwardHeaders(request.headers);
    let body: BodyInit | undefined;
    if (method !== "GET" && method !== "HEAD") {
      const buffer = await request.arrayBuffer();
      if (buffer.byteLength > 0) body = buffer;
    }

    const startedAt = Date.now();
    const send = (budgetMs: number) => fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
      signal: AbortSignal.timeout(budgetMs),
      redirect: "manual",
    });

    let upstreamResponse: Response;
    try {
      upstreamResponse = await send(timeoutMs);
    } catch (error) {
      if ((method !== "GET" && method !== "HEAD") || isTimeoutError(error)) throw error;
      const remainingMs = timeoutMs - (Date.now() - startedAt);
      if (remainingMs <= 0) throw error;
      upstreamResponse = await send(remainingMs);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: filterResponseHeaders(upstreamResponse.headers, proxyTag),
    });
  } catch (error: unknown) {
    const isTimeout = isTimeoutError(error);
    const status = isTimeout ? 504 : 502;
    return Response.json(
      {
        error: isTimeout ? "Gateway Timeout" : "Bad Gateway",
        message: isTimeout ? "Upstream gateway timed out." : "Upstream service is unavailable.",
        status,
      },
      {
        status,
        headers: {
          "x-btc-proxy": proxyTag,
          "cache-control": "no-store",
        },
      }
    );
  }
}
