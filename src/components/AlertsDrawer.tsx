"use client";

import { useEffect, useState } from "react";
import { X, Trash2, Bell } from "lucide-react";
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

export function AlertsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-400" />
            <span className="font-semibold text-slate-200">Thông báo</span>
            {unread > 0 && (
              <span className="text-xs bg-teal-600 text-white px-1.5 py-0.5 rounded-full">
                {unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={() => void handleMarkAll()}
                className="text-xs text-teal-400 hover:underline"
              >
                Đọc hết
              </button>
            )}
            {alerts.length > 0 && (
              <button
                onClick={() => void handleDeleteAll()}
                className="text-xs text-rose-400 hover:underline"
              >
                Xóa tất cả
              </button>
            )}
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {error && alerts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-rose-400 text-sm text-center px-4">{error}</p>
              <button
                onClick={() => void fetchAlerts()}
                className="px-3 py-1.5 rounded bg-slate-800 text-sm hover:bg-slate-700"
              >
                Thử lại
              </button>
            </div>
          )}
          {!error && alerts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm text-center px-6">
              <Bell className="w-10 h-10 mb-3 opacity-30" />
              <p>Chưa có thông báo. Bật cảnh báo và đặt ngưỡng trong tab Cảnh báo.</p>
            </div>
          )}
          <div className="space-y-2">
            {alerts.map((a) => {
              const evidence = alertEvidenceView(a);
              return <div
                key={a.id}
                className={`rounded-lg border px-3 py-2.5 text-sm ${
                  a.isRead
                    ? "border-slate-800 bg-slate-950/50 text-slate-400"
                    : "border-teal-900/40 bg-teal-950/15 text-slate-200"
                }`}
              >
                <div className="font-semibold text-slate-100 text-sm">{a.title}</div>
                <p className="mt-1 text-slate-400 text-xs leading-relaxed">{a.message}</p>
                <div className="mt-2 rounded border border-slate-800 bg-slate-950/60 p-2 text-[10px] leading-relaxed text-slate-400">
                  <div className={evidence.predictive ? "text-emerald-300" : "text-slate-300"}>{evidence.kindLabel}</div>
                  <div>Available: {formatEvidenceTime(a.availableTimeMs)}</div>
                  <div>Provenance: <span className="font-mono">{a.provenance || "legacy/unavailable"}</span></div>
                  <div className={a.deliveryStatus === "failed-at-most-once" ? "text-rose-300" : ""}>{evidence.deliveryLabel}</div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                  <div className="flex items-center gap-2">
                    {!a.isRead && (
                      <button
                        onClick={() => void handleMarkRead(a.id)}
                        className="text-[11px] text-teal-400 hover:underline"
                      >
                        Đã đọc
                      </button>
                    )}
                    <button
                      onClick={() => void handleDelete(a.id)}
                      className="text-[11px] text-rose-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
