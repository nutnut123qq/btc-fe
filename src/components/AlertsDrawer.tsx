"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { X, Trash2, Bell, Check } from "lucide-react";
import { AlertItem } from "@/lib/types";
import {
  getAlerts,
  markAlertRead,
  markAllAlertsRead,
  deleteAlert,
  deleteAllAlerts,
} from "@/lib/api";
import { alertEvidenceView, formatEvidenceTime } from "@/lib/evidencePresentation";

const ALERT_USER_ID = "default";

/**
 * Presentation-only heuristic: worker/pipeline warnings get the amber treatment
 * from the reference (amber dot + amber type label). Detection uses the real
 * `type`/`title` fields — no alert semantics are changed.
 */
const isWorkerWarning = (a: AlertItem) =>
  /worker|warn|stale|trễ/i.test(`${a.type ?? ""} ${a.title ?? ""}`);

export function AlertsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<Element | null>(null);

  const fetchAlerts = async (silent = false) => {
    try {
      const data = await getAlerts(ALERT_USER_ID, 30);
      setAlerts(data.items ?? []);
      setUnread(typeof data.unreadCount === "number" ? data.unreadCount : 0);
      if (!silent) setError(null);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : "Alerts failed");
    }
  };

  useEffect(() => {
    if (!open) return;
    const t1 = setTimeout(() => void fetchAlerts(), 0);
    const t = setInterval(() => void fetchAlerts(true), 15000);
    return () => {
      clearTimeout(t1);
      clearInterval(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Modal focus lifecycle: capture the launcher, focus the panel on open,
  // and return focus to the launcher on close.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement;
    panelRef.current?.focus();
    return () => {
      const el = restoreFocusRef.current;
      if (el instanceof HTMLElement) el.focus();
    };
  }, [open]);

  const handlePanelKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (e.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null);
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markAlertRead(id);
      await fetchAlerts(true);
    } catch {}
  };

  const handleMarkAll = async () => {
    try {
      await markAllAlertsRead(ALERT_USER_ID);
      await fetchAlerts(true);
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAlert(id, ALERT_USER_ID);
      await fetchAlerts(true);
    } catch {}
  };

  const handleDeleteAll = async () => {
    if (!confirm("Xóa toàn bộ thông báo đã lưu?")) return;
    try {
      await deleteAllAlerts(ALERT_USER_ID);
      await fetchAlerts(true);
    } catch {}
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel: bottom sheet (~75% height) below lg, right drawer ~380px on lg+.
          Elevation/shadow lives on the overlay surface only — rows stay flat. */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Thông báo"
        tabIndex={-1}
        onKeyDown={handlePanelKeyDown}
        className="absolute inset-x-0 bottom-0 flex h-[75%] max-h-[640px] flex-col overflow-hidden rounded-t-2xl border-t border-slate-800 bg-slate-900 shadow-2xl shadow-black/70 lg:inset-x-auto lg:right-0 lg:top-0 lg:h-full lg:max-h-none lg:w-[380px] lg:rounded-none lg:border-t-0 lg:border-l"
      >
        {/* Drag handle (mobile sheet affordance) */}
        <div className="flex w-full justify-center pb-1 pt-3 lg:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-850 px-4 py-2 lg:h-12 lg:py-0">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-100">
              Thông báo
            </h2>
            {unread > 0 && (
              <span className="inline-flex items-center rounded border border-teal-500/20 bg-teal-500/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-teal-300">
                {unread} chưa đọc
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <button
                onClick={() => void handleMarkAll()}
                className="px-1.5 py-1 text-xs text-slate-400 transition-colors hover:text-teal-300"
              >
                Đánh dấu đã đọc
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Đóng thông báo"
              className="-mr-2 flex h-10 w-10 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Alert list — flat rows separated by hairlines */}
        <div className="custom-scrollbar flex-1 divide-y divide-slate-800/70 overflow-y-auto">
          {error && alerts.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <p className="px-4 text-center text-sm text-rose-400">{error}</p>
              <button
                onClick={() => void fetchAlerts()}
                className="rounded border border-slate-800 bg-slate-850 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-800"
              >
                Thử lại
              </button>
            </div>
          )}
          {!error && alerts.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-slate-400">
              <Bell className="mb-3 h-10 w-10 opacity-30" />
              <p>Chưa có thông báo. Bật cảnh báo và đặt ngưỡng trong tab Cảnh báo.</p>
            </div>
          )}
          {alerts.map((a) => {
            const evidence = alertEvidenceView(a);
            const warn = isWorkerWarning(a);
            return (
              <div
                key={a.id}
                className={`group px-3.5 py-3 transition-colors hover:bg-slate-850/70 ${
                  a.isRead
                    ? ""
                    : warn
                      ? "bg-amber-500/[0.05]"
                      : "bg-teal-500/[0.04]"
                }`}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        a.isRead
                          ? "bg-transparent"
                          : warn
                            ? "bg-amber-400"
                            : "bg-teal-400"
                      }`}
                    />
                    <span
                      className={`truncate rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                        warn
                          ? "bg-amber-500/10 font-semibold text-amber-300"
                          : "bg-slate-850 text-slate-500"
                      }`}
                    >
                      {a.type || "alert"}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-slate-500">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="pl-4">
                  <div
                    className={`text-[13px] leading-snug ${
                      warn
                        ? "font-semibold text-amber-200"
                        : a.isRead
                          ? "font-medium text-slate-300"
                          : "font-semibold text-slate-100"
                    }`}
                  >
                    {a.title}
                  </div>
                  <p
                    className={`mt-0.5 text-xs leading-relaxed line-clamp-2 ${
                      warn ? "text-amber-300/80" : "text-slate-400"
                    }`}
                  >
                    {a.message}
                  </p>

                  {/* Evidence lines — flat, hairline-separated, mono */}
                  <div className="mt-2 space-y-0.5 border-t border-slate-800/60 pt-1.5 font-mono text-[10px] leading-relaxed text-slate-500">
                    <div className={evidence.predictive ? "text-emerald-300" : "text-slate-400"}>
                      {evidence.kindLabel}
                    </div>
                    <div>Available: {formatEvidenceTime(a.availableTimeMs)}</div>
                    <div>Provenance: {a.provenance || "legacy/unavailable"}</div>
                    <div className={a.deliveryStatus === "failed-at-most-once" ? "text-rose-300" : ""}>
                      {evidence.deliveryLabel}
                    </div>
                  </div>

                  {/* Row actions */}
                  <div className="mt-2 flex items-center justify-end gap-3">
                    {!a.isRead && (
                      <button
                        onClick={() => void handleMarkRead(a.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-teal-400 transition-colors hover:text-teal-300"
                      >
                        <Check className="h-3 w-3" />
                        Đã đọc
                      </button>
                    )}
                    <button
                      onClick={() => void handleDelete(a.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 transition-colors hover:text-rose-400"
                    >
                      <Trash2 className="h-3 w-3" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {alerts.length > 0 && (
          <div className="flex shrink-0 items-center justify-end border-t border-slate-800 bg-slate-900 px-4 py-2.5">
            <button
              onClick={() => void handleDeleteAll()}
              className="flex items-center gap-1.5 text-xs font-medium text-rose-400/80 transition-colors hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa tất cả
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
