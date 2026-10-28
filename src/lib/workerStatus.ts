import type { WorkerHealthDto } from "./types.ts";

type Tone = "neutral" | "warning" | "danger";

// One label/colour map for every screen that lists workers. Keys = the statuses
// GET /api/health/workers emits (backend HealthController.Workers; pinned by tests/workerStatus.test.mts).
const WORKER_STATUS_DISPLAY: Record<WorkerHealthDto["status"], { label: string; tone: Tone }> = {
  healthy: { label: "đang chạy", tone: "neutral" },
  stale: { label: "quá hạn", tone: "warning" },
  failed: { label: "lỗi", tone: "danger" },
  never: { label: "chưa chạy", tone: "warning" },
  disabled: { label: "tắt theo cấu hình", tone: "neutral" },
  idle: { label: "không có việc", tone: "neutral" },
  partial: { label: "chạy một phần", tone: "warning" },
};

const TONE_TEXT: Record<Tone, string> = { neutral: "text-slate-400", warning: "text-amber-300", danger: "text-rose-300" };
const TONE_DOT: Record<Tone, string> = { neutral: "bg-slate-500", warning: "bg-amber-400", danger: "bg-rose-400" };

export const KNOWN_WORKER_STATUSES = Object.keys(WORKER_STATUS_DISPLAY);

// A status the backend adds later keeps its raw value and a neutral colour instead of hiding the worker.
export function workerStatusDisplay(status: string): { label: string; textClass: string; dotClass: string } {
  const known = Object.hasOwn(WORKER_STATUS_DISPLAY, status)
    ? WORKER_STATUS_DISPLAY[status as WorkerHealthDto["status"]]
    : { label: status, tone: "neutral" as const };
  return { label: known.label, textClass: TONE_TEXT[known.tone], dotClass: TONE_DOT[known.tone] };
}
