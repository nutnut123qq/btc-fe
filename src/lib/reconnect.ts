// Exponential backoff for read-only revalidation/polling during an outage.
// failures = consecutive failed attempts so far (0 = healthy → base interval).
export function backoffDelayMs(failures: number, baseMs: number, maxMs: number): number {
  if (!Number.isFinite(failures) || failures <= 0) return baseMs;
  return Math.min(maxMs, baseMs * 2 ** Math.min(failures, 16));
}

/** In-app paths a nav entry may restore; anything else falls back to the tab's default path. */
export function isRestorableHref(href: unknown, allowedPaths: ReadonlySet<string>): href is string {
  if (typeof href !== "string" || !href.startsWith("/") || href.startsWith("//")) return false;
  const path = href.split(/[?#]/, 1)[0];
  return allowedPaths.has(path);
}
