import assert from "node:assert/strict";
import test from "node:test";
import { requireArray, requireArrayField, requireRecord, safeApiErrorMessage } from "../src/lib/apiContract.ts";
import { authenticatedFetch } from "../src/lib/sessionAuth.ts";

test("requireArrayField accepts the expected API shape", () => {
  const result = requireArrayField<number>({ items: [1, 2] }, "items", "history");
  assert.deepEqual(result.items, [1, 2]);
});

test("requireArrayField rejects object instead of array", () => {
  assert.throws(
    () => requireArrayField({ items: { one: 1 } }, "items", "history"),
    /INVALID_API_RESPONSE: history\.items must be an array/,
  );
});

test("requireRecord rejects arrays and requireArray rejects objects", () => {
  assert.throws(() => requireRecord([], "payload"), /must be an object/);
  assert.throws(() => requireArray({}, "payload"), /must be an array/);
});

test("authenticatedFetch fails closed outside an authenticated browser session", async () => {
  await assert.rejects(
    authenticatedFetch("admin", "https://example.invalid"),
    /ADMIN_AUTH_REQUIRED/,
  );
});

test("safeApiErrorMessage hides provider details", () => {
  assert.equal(
    safeApiErrorMessage('{"code":"LLM_NOT_CONFIGURED","message":"BLACKBOX_API_KEY missing"}', 503),
    "Giải thích LLM chưa được cấu hình; các chức năng định lượng vẫn hoạt động.",
  );
  assert.equal(
    safeApiErrorMessage("provider stack trace with secret", 500),
    "Dịch vụ tạm thời không khả dụng (HTTP 500).",
  );
  assert.equal(
    safeApiErrorMessage('{"code":"UNKNOWN","message":"secret provider detail"}', 400),
    "Yêu cầu không hợp lệ (HTTP 400).",
  );
});
