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
  /** Test hook: fixed delay between attempts, bypasses the capped exponential backoff. */
  retryDelayMs?: number;
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
  const method = request.method.toUpperCase();
  const requestPath = `/api/${pathSegments.join("/")}`;
  const startedAt = Date.now();
  let attemptsMade = 0;

  try {
    const upstreamBase = getUpstreamBaseUrl(options.overrideBackendUrl);
    const sanitizedPath = sanitizePathSegments(pathSegments).map(encodeURIComponent).join("/");
    const incomingUrl = new URL(request.url);
    const targetUrl = new URL(`${upstreamBase}/api/${sanitizedPath}`);
    targetUrl.search = incomingUrl.search;

    const forwardHeaders = filterForwardHeaders(request.headers);
    let body: BodyInit | undefined;
    if (method !== "GET" && method !== "HEAD") {
      const buffer = await request.arrayBuffer();
      if (buffer.byteLength > 0) body = buffer;
    }

    const send = (budgetMs: number) => fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body,
      signal: AbortSignal.timeout(budgetMs),
      redirect: "manual",
    });

    // Funnel dips last tens of seconds: ~10 attempts with capped exponential
    // backoff keep retrying ~27s. Only a thrown send() retries — a returned
    // upstream response (even a 502) is forwarded untouched.
    const maxAttempts = method === "GET" || method === "HEAD" ? 10 : 1;
    let upstreamResponse: Response | undefined;
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const remainingMs = timeoutMs - (Date.now() - startedAt);
      if (remainingMs <= 0) throw lastError ?? new DOMException("Proxy timeout", "TimeoutError");
      try {
        attemptsMade = attempt;
        upstreamResponse = await send(remainingMs);
        break;
      } catch (error) {
        lastError = error;
        if (isTimeoutError(error) || attempt === maxAttempts) throw error;
        const delayMs = options.retryDelayMs ?? Math.min(500 * 2 ** (attempt - 1), 5_000) + Math.random() * 100;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    if (!upstreamResponse) throw lastError;

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: filterResponseHeaders(upstreamResponse.headers, proxyTag),
    });
  } catch (error: unknown) {
    const isTimeout = isTimeoutError(error);
    const status = isTimeout ? 504 : 502;
    const errorName = error instanceof Error ? error.name : typeof error;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `[server-proxy] ${method} ${requestPath} failed after ${attemptsMade} attempt(s) in ${Date.now() - startedAt}ms (${isTimeout ? "timeout" : "network"}): ${errorName}: ${errorMessage}`,
    );
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
