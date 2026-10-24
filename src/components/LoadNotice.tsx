"use client";

import { formatClock, isStale, type Loaded } from "@/lib/loadState";

/**
 * Status line for one resource: loading, failed-before-any-data, or stale data
 * after a failed refresh. Renders nothing once fresh data (or a real empty) exists.
 */
export function LoadNotice<T>({ state, what, className = "" }: { state: Loaded<T>; what: string; className?: string }) {
  const reason = state.error?.replace(/[.\s]+$/, "") ?? "";
  if (state.data === null && state.pending) {
    return (
      <div role="status" className={`px-3 py-3 text-xs text-slate-400 ${className}`}>
        Đang tải {what}…
      </div>
    );
  }
  if (state.data === null && state.error !== null) {
    return (
      <div role="alert" data-load-state="error" className={`px-3 py-3 text-xs text-rose-300 ${className}`}>
        Không tải được {what}: {reason}. Chưa có số liệu để hiển thị — đây không phải kết quả rỗng.
      </div>
    );
  }
  if (isStale(state)) {
    return (
      <div role="status" data-load-state="stale" className={`px-3 py-2 text-[11px] text-amber-300 ${className}`}>
        Đang hiển thị {what} tải lúc {formatClock(state.succeededAt!)}; lần làm mới
        {state.attemptedAt !== null ? ` lúc ${formatClock(state.attemptedAt)}` : ""} lỗi: {reason}.
      </div>
    );
  }
  return null;
}
