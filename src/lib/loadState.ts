// One read-model per fetched resource so a screen can tell apart: still loading,
// failed before any success, succeeded-but-empty, succeeded-with-data, and
// "showing older data because the latest refresh failed". A number or an empty
// conclusion may only be rendered from `data`, i.e. from a successful response.

export type Loaded<T> = {
  /** Symbol/filter key the data belongs to; a new scope never inherits old data. */
  scope: string;
  data: T | null;
  succeededAt: number | null;
  attemptedAt: number | null;
  pending: boolean;
  error: string | null;
};

export type LoadView = "loading" | "error" | "empty" | "data";

export function idle<T>(scope = ""): Loaded<T> {
  return { scope, data: null, succeededAt: null, attemptedAt: null, pending: true, error: null };
}

export function begin<T>(prev: Loaded<T>, scope = prev.scope): Loaded<T> {
  if (scope !== prev.scope) return idle<T>(scope);
  return { ...prev, pending: true };
}

/** A response for a scope that is no longer current is dropped. */
export function succeed<T>(prev: Loaded<T>, data: T, nowMs = Date.now(), scope = prev.scope): Loaded<T> {
  if (scope !== prev.scope) return prev;
  return { scope, data, succeededAt: nowMs, attemptedAt: nowMs, pending: false, error: null };
}

/** Failure keeps the last good data and its timestamp; it never refreshes succeededAt. */
export function fail<T>(prev: Loaded<T>, error: unknown, nowMs = Date.now(), scope = prev.scope): Loaded<T> {
  if (scope !== prev.scope) return prev;
  return { ...prev, attemptedAt: nowMs, pending: false, error: errorText(error) };
}

export function settle<T>(prev: Loaded<T>, result: PromiseSettledResult<T>, nowMs = Date.now(), scope = prev.scope): Loaded<T> {
  return result.status === "fulfilled"
    ? succeed(prev, result.value, nowMs, scope)
    : fail(prev, result.reason, nowMs, scope);
}

export function errorText(error: unknown, fallback = "Không tải được dữ liệu"): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
}

export function loadView<T>(state: Loaded<T>, isEmpty: (data: T) => boolean = defaultIsEmpty): LoadView {
  if (state.data !== null) return isEmpty(state.data) ? "empty" : "data";
  if (state.error !== null && !state.pending) return "error";
  return "loading";
}

/** True when old data is on screen because the latest attempt failed. */
export function isStale<T>(state: Loaded<T>): boolean {
  return state.data !== null && state.error !== null;
}

/** Render a metric only from successful data; otherwise an explicit "unknown" dash. */
export function metric<T>(
  state: Loaded<T>,
  pick: (data: T) => number | null | undefined,
  format: (value: number) => string = String,
): string {
  if (state.data === null) return "—";
  const value = pick(state.data);
  return value === null || value === undefined || !Number.isFinite(value) ? "—" : format(value);
}

function defaultIsEmpty(data: unknown): boolean {
  if (Array.isArray(data)) return data.length === 0;
  if (data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)) {
    return (data as { items: unknown[] }).items.length === 0;
  }
  return false;
}

export function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString("vi-VN", { hour12: false });
}
