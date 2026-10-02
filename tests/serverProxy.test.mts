import assert from "node:assert/strict";
import http, { type IncomingMessage, type ServerResponse } from "node:http";
import test from "node:test";
import {
  filterForwardHeaders,
  filterResponseHeaders,
  getUpstreamBaseUrl,
  proxyApiRequest,
  sanitizePathSegments,
} from "../src/lib/serverProxy.ts";

async function withServer(
  handler: (request: IncomingMessage, response: ServerResponse) => void,
  run: (baseUrl: string) => Promise<void>
) {
  const server = http.createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server did not bind to TCP.");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("proxy preserves path, query, status and safe application headers", async () => {
  let receivedUrl = "";
  let receivedAuthorization = "";
  await withServer((request, response) => {
    receivedUrl = request.url ?? "";
    receivedAuthorization = request.headers.authorization ?? "";
    response.writeHead(207, { "content-type": "application/json", "x-upstream": "kept" });
    response.end(JSON.stringify({ ok: true }));
  }, async (baseUrl) => {
    const response = await proxyApiRequest(
      new Request("http://localhost/api/market/trades?symbol=BTCUSDT&limit=30", {
        headers: { authorization: "Bearer valid-token" },
      }),
      ["market", "trades"],
      { overrideBackendUrl: baseUrl }
    );
    assert.equal(response.status, 207);
    assert.equal(response.headers.get("x-upstream"), "kept");
    assert.equal(response.headers.get("x-btc-proxy"), "node");
  });
  assert.equal(receivedUrl, "/api/market/trades?symbol=BTCUSDT&limit=30");
  assert.equal(receivedAuthorization, "Bearer valid-token");
});

test("proxy forwards a mutation body once without retrying upstream failures", async () => {
  let calls = 0;
  let receivedBody = "";
  await withServer((request, response) => {
    calls++;
    request.on("data", (chunk) => { receivedBody += chunk.toString("utf8"); });
    request.on("end", () => {
      response.writeHead(503, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "overloaded" }));
    });
  }, async (baseUrl) => {
    const payload = JSON.stringify({ symbol: "BTCUSDT", amount: 0.5 });
    const response = await proxyApiRequest(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: payload,
      }),
      ["orders"],
      { overrideBackendUrl: baseUrl }
    );
    assert.equal(response.status, 503);
    assert.equal(receivedBody, payload);
  });
  assert.equal(calls, 1);
});

test("proxy retries transient GET transport failures", async () => {
  let calls = 0;
  await withServer((request, response) => {
    calls++;
    if (calls < 5) {
      request.socket.destroy();
      return;
    }
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
  }, async (baseUrl) => {
    const response = await proxyApiRequest(
      new Request("http://localhost/api/health/ready"),
      ["health", "ready"],
      { overrideBackendUrl: baseUrl }
    );
    assert.equal(response.status, 200);
  });
  assert.equal(calls, 5);
});

test("proxy retries transport failures beyond the old five-attempt window", async () => {
  let calls = 0;
  await withServer((request, response) => {
    calls++;
    if (calls < 8) {
      request.socket.destroy();
      return;
    }
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
  }, async (baseUrl) => {
    const response = await proxyApiRequest(
      new Request("http://localhost/api/health/ready"),
      ["health", "ready"],
      { overrideBackendUrl: baseUrl, retryDelayMs: 1 }
    );
    assert.equal(response.status, 200);
  });
  assert.equal(calls, 8);
});

test("proxy forwards an upstream 502 without retrying it", async () => {
  let calls = 0;
  await withServer((request, response) => {
    calls++;
    response.writeHead(502, { "content-type": "text/plain" });
    response.end("funnel dip");
  }, async (baseUrl) => {
    const response = await proxyApiRequest(
      new Request("http://localhost/api/market/tickers"),
      ["market", "tickers"],
      { overrideBackendUrl: baseUrl, retryDelayMs: 1 }
    );
    assert.equal(response.status, 502);
    assert.equal(await response.text(), "funnel dip");
  });
  assert.equal(calls, 1);
});

test("proxy logs one sanitized line when transport retries are exhausted", async () => {
  const originalError = console.error;
  const logs: string[] = [];
  console.error = (...args: unknown[]) => { logs.push(args.join(" ")); };
  try {
    let calls = 0;
    await withServer((request) => {
      calls++;
      request.socket.destroy();
    }, async (baseUrl) => {
      const response = await proxyApiRequest(
        new Request("http://localhost/api/secret/endpoint?token=secret123"),
        ["secret", "endpoint"],
        { overrideBackendUrl: baseUrl, retryDelayMs: 1 }
      );
      assert.equal(response.status, 502);
    });
    assert.ok(calls > 1);
  } finally {
    console.error = originalError;
  }
  assert.equal(logs.length, 1);
  assert.match(logs[0], /\[server-proxy\] GET \/api\/secret\/endpoint failed after \d+ attempt\(s\) in \d+ms \(network\):/);
  assert.ok(!logs[0].includes("secret123"));
});

test("proxy never retries a mutation after a transport failure", async () => {
  let calls = 0;
  await withServer((request) => {
    calls++;
    request.socket.destroy();
  }, async (baseUrl) => {
    const response = await proxyApiRequest(
      new Request("http://localhost/api/order", { method: "POST", body: "{}" }),
      ["order"],
      { overrideBackendUrl: baseUrl }
    );
    assert.equal(response.status, 502);
  });
  assert.equal(calls, 1);
});

test("proxy rejects traversal and encodes reserved characters in path segments", async () => {
  assert.throws(() => sanitizePathSegments(["..", "admin"]), /Invalid path segment/);
  assert.throws(() => sanitizePathSegments(["safe/subpath"]), /Invalid path segment/);
  assert.throws(() => sanitizePathSegments(["safe\\subpath"]), /Invalid path segment/);

  let receivedUrl = "";
  await withServer((request, response) => {
    receivedUrl = request.url ?? "";
    response.writeHead(200);
    response.end();
  }, async (baseUrl) => {
    const response = await proxyApiRequest(
      new Request("http://localhost/api/report"),
      ["report ?#"],
      { overrideBackendUrl: baseUrl }
    );
    assert.equal(response.status, 200);
  });
  assert.equal(receivedUrl, "/api/report%20%3F%23");
});

test("proxy strips hop-by-hop and spoofed forwarding headers", () => {
  const requestHeaders = filterForwardHeaders(new Headers({
    host: "evil.example",
    connection: "keep-alive",
    "content-length": "100",
    "x-forwarded-host": "evil.example",
    "x-forwarded-for": "203.0.113.7, 10.0.0.1",
    "x-session-key": "session",
  }));
  assert.equal(requestHeaders.has("host"), false);
  assert.equal(requestHeaders.has("connection"), false);
  assert.equal(requestHeaders.has("content-length"), false);
  assert.equal(requestHeaders.has("x-forwarded-host"), false);
  // The edge-set client IP (first hop) is restored so the backend can
  // partition rate limits per real client instead of per Funnel ingress.
  assert.equal(requestHeaders.get("x-forwarded-for"), "203.0.113.7");
  assert.equal(requestHeaders.get("x-session-key"), "session");

  // Without an incoming XFF there is no trustworthy client IP — the header
  // must stay absent rather than being fabricated.
  const noXffHeaders = filterForwardHeaders(new Headers({
    "x-forwarded-host": "evil.example",
    "x-session-key": "session",
  }));
  assert.equal(noXffHeaders.has("x-forwarded-for"), false);
  assert.equal(noXffHeaders.has("x-forwarded-host"), false);

  const responseHeaders = filterResponseHeaders(new Headers({
    connection: "close",
    "content-encoding": "gzip",
    "x-custom": "kept",
  }));
  assert.equal(responseHeaders.has("connection"), false);
  assert.equal(responseHeaders.has("content-encoding"), false);
  assert.equal(responseHeaders.get("x-custom"), "kept");
});

test("proxy proves ingress with the shared secret and strips client spoofs", () => {
  const original = process.env.INGRESS_SHARED_SECRET;
  try {
    process.env.INGRESS_SHARED_SECRET = "test-secret";
    const proven = filterForwardHeaders(new Headers({
      "x-btc-ingress": "client-spoofed",
      "x-forwarded-for": "203.0.113.7",
    }));
    assert.equal(proven.get("x-btc-ingress"), "test-secret");
    assert.equal(proven.get("x-forwarded-for"), "203.0.113.7");

    delete process.env.INGRESS_SHARED_SECRET;
    const unconfigured = filterForwardHeaders(new Headers({ "x-btc-ingress": "client-spoofed" }));
    assert.equal(unconfigured.has("x-btc-ingress"), false);
  } finally {
    if (original === undefined) delete process.env.INGRESS_SHARED_SECRET;
    else process.env.INGRESS_SHARED_SECRET = original;
  }
});

test("proxy returns a sanitized timeout without leaking its upstream URL", async () => {
  await withServer(() => {}, async (baseUrl) => {
    const response = await proxyApiRequest(
      new Request("http://localhost/api/slow"),
      ["slow"],
      { overrideBackendUrl: baseUrl, timeoutMs: 50 }
    );
    const body = await response.text();
    assert.equal(response.status, 504);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(body.includes(baseUrl), false);
  });
});

test("Vercel never falls back to localhost or an insecure upstream", () => {
  const originalVercel = process.env.VERCEL;
  const originalBackend = process.env.BACKEND_INTERNAL_URL;
  try {
    process.env.VERCEL = "1";
    delete process.env.BACKEND_INTERNAL_URL;
    assert.throws(() => getUpstreamBaseUrl(), /not configured/);

    process.env.BACKEND_INTERNAL_URL = "http://insecure.example";
    assert.throws(() => getUpstreamBaseUrl(), /must use HTTPS/);
    assert.equal(getUpstreamBaseUrl("https://backend.example/"), "https://backend.example");
  } finally {
    if (originalVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = originalVercel;
    if (originalBackend === undefined) delete process.env.BACKEND_INTERNAL_URL;
    else process.env.BACKEND_INTERNAL_URL = originalBackend;
  }
});
