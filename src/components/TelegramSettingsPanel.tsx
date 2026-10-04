"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { getTelegramStatus, testTelegram } from "@/lib/api";

export function TelegramSettingsPanel({
  adminUnlocked = false,
  contractCompatible = false,
}: {
  adminUnlocked?: boolean;
  contractCompatible?: boolean;
}) {
  const [configured, setConfigured] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const load = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const data = await getTelegramStatus();
      setConfigured(data.configured);
      setEnabled(data.enabled);
    } catch (e) {
      console.error("Failed to load Telegram status", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testTelegram();
      setTestResult(res);
    } catch (e: unknown) {
      setTestResult({ success: false, message: e instanceof Error ? e.message : "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <section className="overflow-hidden rounded border border-slate-800 bg-slate-900 text-xs">
        <header className="flex min-h-10 items-center gap-1.5 border-b border-slate-800 bg-slate-850/60 px-3 py-1">
          <MessageCircle className="h-3.5 w-3.5 text-slate-500" />
          <h3 className="text-[13px] font-semibold text-slate-200">Telegram Bot</h3>
        </header>
        <p className="p-3 text-xs text-slate-500">Đang tải cấu hình Telegram…</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded border border-slate-800 bg-slate-900 text-xs">
      <header className="flex min-h-10 items-center justify-between gap-3 border-b border-slate-800 bg-slate-850/60 px-3 py-1">
        <h3 className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-200">
          <MessageCircle className="h-3.5 w-3.5 text-slate-500" /> Telegram Bot
        </h3>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className={`h-1.5 w-1.5 rounded-full ${configured ? "bg-slate-400" : "bg-slate-700"}`} aria-hidden="true" />
            {configured ? "đã cấu hình" : "chưa cấu hình"}
          </span>
          {enabled && (
            <span className="flex items-center gap-1.5 text-teal-300">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" aria-hidden="true" />
              đang bật
            </span>
          )}
        </div>
      </header>

      <div className="space-y-3 p-3 sm:p-4">
        <p className="text-[13px] text-slate-400">
          Bot Telegram gửi cảnh báo giá, tín hiệu ML và paper trading trực tiếp tới điện thoại của bạn.
        </p>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Token và Chat ID được cấu hình trong <code className="rounded bg-slate-950 px-1 py-0.5 font-mono text-slate-300">appsettings.json</code> ở backend để đảm bảo bảo mật. Màn này chỉ xem trạng thái và gửi tin nhắn test.
        </p>

        <button
          type="button"
          onClick={() => void handleTest()}
          disabled={!configured || testing || !adminUnlocked || !contractCompatible}
          className="inline-flex h-10 items-center gap-2 rounded border border-slate-700 bg-slate-950 px-4 text-sm font-medium text-slate-300 transition-colors hover:border-teal-700 hover:text-teal-300 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
          {testing ? "Đang gửi…" : "Gửi tin nhắn test"}
        </button>

        {testResult && (
          <div
            className={`border-l-2 px-3 py-2 text-xs ${
              testResult.success
                ? "border-emerald-600/70 bg-emerald-950/20 text-emerald-300"
                : "border-rose-600/70 bg-rose-950/20 text-rose-300"
            }`}
          >
            {testResult.message}
          </div>
        )}
      </div>
    </section>
  );
}
