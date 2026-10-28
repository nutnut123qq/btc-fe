import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { KNOWN_WORKER_STATUSES, workerStatusDisplay } from "../src/lib/workerStatus.ts";

const backendHealth = new URL("../../backend/Controllers/HealthController.cs", import.meta.url);

test("worker status display: Vietnamese labels, disabled/idle neutral, partial amber, failed red", () => {
  assert.deepEqual(
    Object.fromEntries(KNOWN_WORKER_STATUSES.map((status) => [status, workerStatusDisplay(status).label])),
    {
      healthy: "đang chạy", stale: "quá hạn", failed: "lỗi", never: "chưa chạy",
      disabled: "tắt theo cấu hình", idle: "không có việc", partial: "chạy một phần",
    },
  );
  for (const status of ["disabled", "idle", "healthy"]) {
    const { textClass, dotClass } = workerStatusDisplay(status);
    assert.deepEqual([textClass, dotClass], ["text-slate-400", "bg-slate-500"], status);
  }
  assert.equal(workerStatusDisplay("partial").textClass, "text-amber-300");
  assert.equal(workerStatusDisplay("stale").textClass, "text-amber-300");
  assert.equal(workerStatusDisplay("failed").textClass, "text-rose-300");
});

test("an unknown worker status keeps its raw value with a neutral colour", () => {
  for (const status of ["paused", "constructor", "toString"]) {
    assert.deepEqual(workerStatusDisplay(status), { label: status, textClass: "text-slate-400", dotClass: "bg-slate-500" });
  }
});

// Frontend CI checks out only this repo, so the backend source exists only in the local workspace.
test("known worker statuses match what backend HealthController.Workers emits", { skip: !existsSync(backendHealth) && "backend source not checked out" }, () => {
  const source = readFileSync(backendHealth, "utf8");
  const start = source.indexOf("Task<ActionResult<WorkerHealthResponse>> Workers(");
  assert.ok(start > 0, "HealthController.Workers not found");
  const body = source.slice(start, source.indexOf("catch (OperationCanceledException)", start));
  // Status values are the only all-lowercase one-word string literals in the method.
  const emitted = new Set([...body.matchAll(/"([a-z]+)"/g)].map((match) => match[1]));
  assert.deepEqual([...emitted].sort(), [...KNOWN_WORKER_STATUSES].sort());
});

test("both worker lists use the shared status map instead of their own labels", () => {
  for (const file of ["SystemStatusPanel.tsx", "ResearchEvidenceScreen.tsx"]) {
    const source = readFileSync(new URL(`../src/components/${file}`, import.meta.url), "utf8");
    assert.match(source, /import \{ workerStatusDisplay \} from "@\/lib\/workerStatus";/, file);
    assert.match(source, /workerStatusDisplay\(worker\.status\)/, file);
    assert.doesNotMatch(source, /WORKER_STATUS_LABEL|"chưa chạy"|"quá hạn"|worker\.status === "healthy"/, file);
  }
  const evidence = readFileSync(new URL("../src/components/ResearchEvidenceScreen.tsx", import.meta.url), "utf8");
  // The glossary entry "partial" describes data coverage, so a partial worker cycle must not link to it.
  assert.match(evidence, /worker\.status === "partial" \? display\.label : <GlossaryTerm term=\{worker\.status\}>/);
});
