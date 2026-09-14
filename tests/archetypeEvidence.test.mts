import assert from "node:assert/strict";
import test from "node:test";
import { getDirectionText, isDirectionMatch } from "../src/lib/archetypeEvidence.ts";

test("fixed-horizon directions have unambiguous Vietnamese labels", () => {
  assert.equal(getDirectionText(1), "TĂNG");
  assert.equal(getDirectionText(-1), "GIẢM");
  assert.equal(getDirectionText(0), "ĐI NGANG");
  assert.equal(getDirectionText(null), "CHƯA CÓ");
});

test("direction match is unavailable when either side is missing", () => {
  assert.equal(isDirectionMatch(1, 1), true);
  assert.equal(isDirectionMatch(-1, 1), false);
  assert.equal(isDirectionMatch(null, 1), null);
  assert.equal(isDirectionMatch(1, null), null);
});
