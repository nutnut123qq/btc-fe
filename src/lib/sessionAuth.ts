export type SessionKeyKind = "admin" | "execution";

const storageKeys: Record<SessionKeyKind, string> = {
  admin: "btc.adminKey",
  execution: "btc.executionKey",
};

export function getSessionKey(kind: SessionKeyKind): string {
  if (typeof window === "undefined") return "";
  return window.sessionStorage.getItem(storageKeys[kind])?.trim() ?? "";
}

export function setSessionKey(kind: SessionKeyKind, value: string): void {
  if (typeof window === "undefined") return;
  const key = value.trim();
  if (key) window.sessionStorage.setItem(storageKeys[kind], key);
  else window.sessionStorage.removeItem(storageKeys[kind]);
}

export async function authenticatedFetch(
  kind: SessionKeyKind,
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const key = getSessionKey(kind);
  if (!key) throw new Error(`${kind.toUpperCase()}_AUTH_REQUIRED`);

  const headers = new Headers(init.headers);
  headers.set(kind === "admin" ? "X-Admin-Key" : "X-Execution-Key", key);
  return fetch(input, { ...init, headers });
}
