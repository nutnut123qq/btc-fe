"use client";

import { useCallback, useEffect, useState } from "react";
import { Settings, RefreshCw } from "lucide-react";
import { AlertSettingsDto, KLINE_OPTIONS } from "@/lib/types";
import { getAlertSettings, putAlertSettings } from "@/lib/api";
import { TelegramSettingsPanel } from "./TelegramSettingsPanel";
import { DataManagementPanel } from "./DataManagementPanel";
import { ErrorBoundary } from "./ErrorBoundary";
import { SessionAccessPanel } from "./SessionAccessPanel";
import { getSessionKey } from "@/lib/sessionAuth";

const ALERT_USER_ID = "default";

export function AlertSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [adminUnlocked, setAdminUnlocked] = useState(() => Boolean(getSessionKey("admin")));

  const [enabled, setEnabled] = useState(false);
  const [priceAbove, setPriceAbove] = useState("");
  const [priceBelow, setPriceBelow] = useState("");
  const [klineInterval, setKlineInterval] = useState<string>("1m");
  const [cooldownMinutes, setCooldownMinutes] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: AlertSettingsDto | null = await getAlertSettings(ALERT_USER_ID);
      if (data) {
        setEnabled(data.enabled);
        setPriceAbove(data.priceAboveUsd != null ? String(data.priceAboveUsd) : "");
        setPriceBelow(data.priceBelowUsd != null ? String(data.priceBelowUsd) : "");
        setKlineInterval(data.klineInterval || "1m");
        setCooldownMinutes(typeof data.cooldownMinutes === "number" ? data.cooldownMinutes : 30);
      } else {
        setEnabled(false);
        setPriceAbove("");
        setPriceBelow("");
        setKlineInterval("1m");
        setCooldownMinutes(30);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được cấu hình alert");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setOk(null);
    const aboveTrim = priceAbove.trim();
    const belowTrim = priceBelow.trim();
    const above = aboveTrim === "" ? null : Number.parseFloat(aboveTrim.replace(",", "."));
    const below = belowTrim === "" ? null : Number.parseFloat(belowTrim.replace(",", "."));
    if (aboveTrim !== "" && (Number.isNaN(above!) || above! < 0)) {
      setError("Giá trên không hợp lệ");
      setSaving(false);
      return;
    }
    if (belowTrim !== "" && (Number.isNaN(below!) || below! < 0)) {
      setError("Giá dưới không hợp lệ");
      setSaving(false);
      return;
    }
    if (aboveTrim !== "" && belowTrim !== "" && !Number.isNaN(above!) && !Number.isNaN(below!) && above! <= below!) {
      setError("Giá trên phải lớn hơn giá dưới khi nhập cả hai (dải giá hợp lệ).");
      setSaving(false);
      return;
    }
    const cd = Number.parseInt(String(cooldownMinutes), 10) || 30;
    if (cd < 1 || cd > 1440) {
      setError("Cooldown từ 1 đến 1440 phút.");
      setSaving(false);
      return;
    }
    try {
      await putAlertSettings(ALERT_USER_ID, {
        userId: ALERT_USER_ID,
        enabled,
        priceAboveUsd: aboveTrim === "" ? null : above,
        priceBelowUsd: belowTrim === "" ? null : below,
        klineInterval,
        cooldownMinutes: cd,
        updatedAt: new Date().toISOString(),
      });
      setOk("Đã lưu.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="text-amber-400" />
          Cài đặt cảnh báo giá (BTC)
        </h2>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-gray-200 inline-flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Điều kiện lưu trong PostgreSQL; worker backend so sánh giá đóng nến Binance theo chu kỳ cấu hình.
      </p>

      <SessionAccessPanel
        kind="admin"
        label="Quyền quản trị"
        onChange={setAdminUnlocked}
      />

      {loading && <p className="text-gray-500 text-sm">Đang tải…</p>}

      {!loading && (
        <div className="space-y-4 text-sm bg-gray-900/60 rounded-xl border border-gray-800 p-5">
          {error && <div className="text-rose-400 text-xs break-words whitespace-pre-wrap">{error}</div>}
          {ok && <div className="text-emerald-400 text-xs">{ok}</div>}

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setEnabled((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-teal-600" : "bg-gray-700"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  enabled ? "translate-x-5" : ""
                }`}
              />
            </div>
            <span>Bật cảnh báo theo ngưỡng</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Giá trên (USDT, để trống = tắt)</label>
              <input
                type="text"
                inputMode="decimal"
                value={priceAbove}
                onChange={(e) => setPriceAbove(e.target.value)}
                placeholder="vd: 95000"
                className="w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2 text-gray-200 focus:outline-none focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Giá dưới (USDT, để trống = tắt)</label>
              <input
                type="text"
                inputMode="decimal"
                value={priceBelow}
                onChange={(e) => setPriceBelow(e.target.value)}
                placeholder="vd: 80000"
                className="w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2 text-gray-200 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-600">
            Nếu nhập cả hai: <strong className="text-gray-500 font-medium">giá trên &gt; giá dưới</strong> (dải giữa hai mức; báo khi
            vượt trên hoặc rơi dưới).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Khung nến (giá đóng)</label>
              <select
                value={klineInterval}
                onChange={(e) => setKlineInterval(e.target.value)}
                className="w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2 text-gray-200 focus:outline-none focus:border-teal-600"
              >
                {KLINE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cooldown (phút)</label>
              <input
                type="number"
                min={1}
                max={1440}
                value={cooldownMinutes}
                onChange={(e) => setCooldownMinutes(Number(e.target.value))}
                className="w-full rounded-lg bg-gray-950 border border-gray-700 px-3 py-2 text-gray-200 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={saving || !adminUnlocked}
            onClick={() => void save()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? "Đang lưu…" : "Lưu cấu hình"}
          </button>
        </div>
      )}

      <hr className="border-gray-800 my-6" />

      <TelegramSettingsPanel adminUnlocked={adminUnlocked} />

      <hr className="border-gray-800 my-6" />

      <ErrorBoundary fallbackTitle="Lỗi tải Bảng Quản trị Dữ liệu & Kiểm toán">
        <DataManagementPanel adminUnlocked={adminUnlocked} />
      </ErrorBoundary>
    </div>
  );
}
