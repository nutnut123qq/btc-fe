"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Send, CheckCircle2, XCircle } from "lucide-react";
import { getTelegramStatus, testTelegram } from "@/lib/api";

export function TelegramSettingsPanel() {
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
    } catch (e: any) {
      setTestResult({ success: false, message: e?.message ?? "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500 py-4">Đang tải cấu hình Telegram...</div>;
  }

  return (
    <div className="bg-gray-900/60 rounded-xl border border-gray-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-md font-semibold flex items-center gap-2 text-gray-200">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          Cấu hình Telegram Bot
        </h3>
        <div className="flex items-center gap-2">
          {configured ? (
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã cấu hình
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">
              <XCircle className="w-3.5 h-3.5" />
              Chưa cấu hình
            </span>
          )}
          {enabled && (
            <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 font-medium">
              Đang bật
            </span>
          )}
        </div>
      </div>

      <div className="text-sm text-gray-400 space-y-2">
        <p>
          Bot Telegram dùng để gửi cảnh báo giá, tín hiệu ML và paper trading trực tiếp tới điện thoại của bạn.
        </p>
        <p className="text-xs text-gray-500">
          Lưu ý: Token và Chat ID được cấu hình trong <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-300">appsettings.json</code> ở backend để đảm bảo bảo mật. Frontend chỉ dùng để xem trạng thái và gửi tin nhắn test.
        </p>
      </div>

      <div className="pt-2">
        <button
          onClick={() => void handleTest()}
          disabled={!configured || testing}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {testing ? "Đang gửi..." : "Gửi tin nhắn Test"}
        </button>
      </div>

      {testResult && (
        <div className={`p-3 rounded-lg text-sm border ${testResult.success ? "bg-emerald-950/30 border-emerald-900 text-emerald-300" : "bg-rose-950/30 border-rose-900 text-rose-300"}`}>
          {testResult.message}
        </div>
      )}
    </div>
  );
}
