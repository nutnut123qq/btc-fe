import assert from "node:assert/strict";
import test from "node:test";
import { parseAiSseLine, parseAiSseTranscript } from "../src/lib/aiStream.ts";

test("SSE parser accepts JSON tokens only when a terminal done event exists", () => {
  assert.deepEqual(
    parseAiSseTranscript('data: {"token":"Xin "}\n\ndata: {"token":"chào"}\n\ndata: {"done":true,"evidence_tags":["Quant"]}\n'),
    [
      { type: "token", token: "Xin " },
      { type: "token", token: "chào" },
      { type: "done", evidenceTags: ["Quant"] },
    ],
  );
});

test("SSE parser rejects raw, malformed and structured error events", () => {
  assert.throws(() => parseAiSseLine("raw provider error"), /AI_STREAM_INVALID_EVENT/);
  assert.throws(() => parseAiSseLine("data: not-json"), /AI_STREAM_INVALID_JSON/);
  assert.throws(
    () => parseAiSseLine('data: {"code":"LLM_NOT_CONFIGURED","error":"secret"}'),
    /AI_STREAM_ERROR/,
  );
});

test("SSE parser rejects a stream truncated before done", () => {
  assert.throws(
    () => parseAiSseTranscript('data: {"token":"partial"}\n'),
    /AI_STREAM_TRUNCATED/,
  );
});
