import assert from "node:assert/strict";
import test from "node:test";
import { countCapabilityStates, parseTechnicalCapabilities } from "../src/lib/technicalCapabilities.ts";

const response = {
  contractVersion: "btc-technical-capabilities-v2",
  symbol: "BTCUSDT",
  generatedAtUtc: "2026-09-21T00:00:00Z",
  items: [{
    id: "market-data",
    name: "Market data",
    category: "Data",
    operationalStatus: "operational",
    evidenceStage: "validated",
    evidenceTarget: "data-integrity",
    intendedUse: "Finalized BTC candles",
    limitation: "Exchange gaps remain explicit",
    endpoint: "/api/market/klines",
    version: "v1",
  }],
};

test("technical capability registry preserves operational and evidence semantics", () => {
  const parsed = parseTechnicalCapabilities(response);
  assert.equal(parsed.items[0].operationalStatus, "operational");
  assert.equal(parsed.items[0].evidenceStage, "validated");
  assert.equal(parsed.items[0].evidenceTarget, "data-integrity");
  assert.deepEqual(countCapabilityStates(parsed.items), {
    operational: 1,
    unavailable: 0,
    validated: 1,
    forwardObserved: 0,
  });
});

test("technical capability registry fails closed on unknown states and duplicate ids", () => {
  assert.throws(() => parseTechnicalCapabilities({ ...response, items: [
    response.items[0],
    { ...response.items[0] },
  ] }), /unique/);
  assert.throws(() => parseTechnicalCapabilities({ ...response, items: [{
    ...response.items[0], operationalStatus: "great",
  }] }), /unknown operationalStatus/);
  assert.throws(() => parseTechnicalCapabilities({ ...response, symbol: "ETHUSDT" }), /unsupported research symbol/);
  assert.throws(() => parseTechnicalCapabilities({ ...response, items: [{
    ...response.items[0], evidenceTarget: "alpha",
  }] }), /unknown evidenceTarget/);
});
