import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createNextConfig } from "../next.config.ts";
import { EXPECTED_API_CONTRACT_VERSION } from "../src/lib/apiContract.ts";
import { getSignalRHubUrl } from "../src/lib/tradeStream.ts";

test("local build uses next start config and local-safe server rewrites", async () => {
  const config = createNextConfig({});
  assert.equal(config.output, undefined);
  const rewrites = await config.rewrites!();
  assert.ok(Array.isArray(rewrites));
  assert.deepEqual(rewrites, [
    { source: "/hubs/:path*", destination: "http://127.0.0.1:5197/hubs/:path*" },
  ]);
  assert.equal(rewrites.some((r) => r.source.startsWith("/api")), false);
});

test("standalone and Docker backend routing are explicit build settings", async () => {
  const config = createNextConfig({ NEXT_STANDALONE: "1", BACKEND_INTERNAL_URL: "http://backend:5197/" });
  assert.equal(config.output, "standalone");
  const rewrites = await config.rewrites!();
  assert.ok(Array.isArray(rewrites));
  assert.equal(rewrites[0]?.destination, "http://backend:5197/hubs/:path*");
  assert.equal(rewrites.some((r) => r.source.startsWith("/api")), false);
});

test("security headers are applied to all routes without HSTS duplication", async () => {
  const expected = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' wss://stream.binance.com:9443; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  };
  for (const env of [{}, { NEXT_STANDALONE: "1" }]) {
    const config = createNextConfig(env);
    const headers = await config.headers!();
    assert.ok(Array.isArray(headers));
    const entry = headers.find((h) => h.source === "/(.*)");
    assert.ok(entry, "missing header entry for source \"/(.*)\"");
    assert.equal(entry.headers.length, new Set(entry.headers.map((h) => h.key)).size, "duplicate header keys");
    const byKey = new Map(entry.headers.map(({ key, value }) => [key, value]));
    for (const [key, value] of Object.entries(expected)) {
      assert.equal(byKey.get(key), value, `header ${key}`);
    }
    assert.equal(byKey.has("Strict-Transport-Security"), false);
  }
});

test("browser API and SignalR URLs stay same-origin", async () => {
  const apiSource = await readFile(new URL("../src/lib/api.ts", import.meta.url), "utf8");
  assert.equal(apiSource.includes("NEXT_PUBLIC_API_BASE"), false);
  assert.match(apiSource, /const API_BASE = "";/);
  assert.equal(getSignalRHubUrl(), "/hubs/trade-notifications");
});

test("pinned OpenAPI contract matches the runtime contract gate", async () => {
  const schema = JSON.parse(await readFile(new URL("../contracts/openapi.json", import.meta.url), "utf8"));
  assert.equal(schema.info?.version, EXPECTED_API_CONTRACT_VERSION);
  assert.ok(schema.paths?.["/api/meta"]);
  assert.ok(schema.paths?.["/api/health/freshness"]);
  assert.ok(schema.paths?.["/api/Market/data-audit"]);
});
