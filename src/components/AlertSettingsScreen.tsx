"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, RefreshCw } from "lucide-react";
import { AlertSettingsDto } from "@/lib/types";
import { getAlertSettings, putAlertSettings } from "@/lib/api";
import { TelegramSettingsPanel } from "./TelegramSettingsPanel";
import { DataManagementPanel } from "./DataManagementPanel";
import { ErrorBoundary } from "./ErrorBoundary";
import { SessionAccessPanel } from "./SessionAccessPanel";
import { SystemStatusPanel } from "./SystemStatusPanel";
import { TechnicalCapabilitiesPanel } from "./TechnicalCapabilitiesPanel";
import { getSessionKey } from "@/lib/sessionAuth";
import { ACTIVE_TIMEFRAMES, DEFAULT_TIMEFRAME, normalizeActiveTimeframe } from "@/lib/timeframe";

const ALERT_USER_ID = "default";

export function AlertSettingsScreen({ contractCompatible = false }: { contractCompatible?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [adminUnlocked, setAdminUnlocked] = useState(() => Boolean(getSessionKey("admin")));

  const [enabled, setEnabled] = useState(false);
  const [priceAbove, setPriceAbove] = useState("");
  const [priceBelow, setPriceBelow] = useState("");
  const [klineInterval, setKlineInterval] = useState<string>(DEFAULT_TIMEFRAME);
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
        setKlineInterval(normalizeActiveTimeframe(data.klineInterval));
        setCooldownMinutes(typeof data.cooldownMinutes === "number" ? data.cooldownMinutes : 30);
      } else {
        setEnabled(false);
        setPriceAbove("");
        setPriceBelow("");
        setKlineInterval(DEFAULT_TIMEFRAME);
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

  // Derived display-only validation hints (save() keeps the real checks).
  const aboveTrim = priceAbove.trim();
  const belowTrim = priceBelow.trim();
  const aboveParsed = aboveTrim === "" ? null : Number.parseFloat(aboveTrim.replace(",", "."));
  const belowParsed = belowTrim === "" ? null : Number.parseFloat(belowTrim.replace(",", "."));
  const aboveInvalid = aboveTrim !== "" && (Number.isNaN(aboveParsed!) || aboveParsed! < 0);
  const belowInvalid = belowTrim !== "" && (Number.isNaN(belowParsed!) || belowParsed! < 0);
  const rangeInvalid =
    aboveTrim !== "" &&
    belowTrim !== "" &&
    !aboveInvalid &&
    !belowInvalid &&
    aboveParsed! <= belowParsed!;
  const cooldownParsed = Number.parseInt(String(cooldownMinutes), 10) || 30;
  const cooldownInvalid = cooldownParsed < 1 || cooldownParsed > 1440;

  const inputClass =
    "h-10 w-full rounded border border-slate-800 bg-slate-950 px-3 font-mono text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-teal-500 focus:outline-none disabled:opacity-50";

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-slate-100">Cảnh báo</h2>
          <p className="mt-0.5 text-[13px] text-slate-400">
            Ngưỡng giá BTC và tần suất kiểm tra; worker backend so sánh giá đóng nến Binance theo chu kỳ cấu hình.
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 px-1 text-xs text-slate-400 transition-colors hover:text-slate-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      <SessionAccessPanel
        kind="admin"
        label="Quyền quản trị"
        onChange={setAdminUnlocked}
      />

      {!contractCompatible && (
        <p className="border-l-2 border-amber-500/70 bg-amber-950/20 px-3 py-2 text-xs text-amber-200" role="alert">
          API contract chưa được xác nhận; các thao tác ghi trong Settings và Lab đang bị khóa.
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-7">
          {loading && <p className="text-sm text-slate-500">Đang tải…</p>}

          {!loading && (
            <>
              <section className="overflow-hidden rounded border border-slate-800 bg-slate-900">
                <header className="flex min-h-10 items-center justify-between gap-3 border-b border-slate-800 bg-slate-850/60 px-3 py-1">
                  <h3 className="text-[13px] font-semibold text-slate-200">Ngưỡng giá</h3>
                  <span className="font-mono text-[11px] text-slate-500">BTC/USDT</span>
                </header>
                <div className="space-y-4 p-3 sm:p-4">
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <label htmlFor="price-above" className="text-xs text-slate-400">Giá trên</label>
                      {aboveInvalid ? (
                        <span className="flex items-center gap-1 text-[11px] text-amber-300">
                          <AlertTriangle className="h-3 w-3" /> giá trị không hợp lệ
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">để trống = tắt</span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <input
                        id="price-above"
                        type="text"
                        inputMode="decimal"
                        value={priceAbove}
                        onChange={(e) => setPriceAbove(e.target.value)}
                        placeholder="vd: 95000"
                        className={`${inputClass} pr-14`}
                      />
                      <span className="pointer-events-none absolute right-3 font-mono text-xs text-slate-500">USDT</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <label htmlFor="price-below" className="text-xs text-slate-400">Giá dưới</label>
                      {belowInvalid ? (
                        <span className="flex items-center gap-1 text-[11px] text-amber-300">
                          <AlertTriangle className="h-3 w-3" /> giá trị không hợp lệ
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">để trống = tắt</span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <input
                        id="price-below"
                        type="text"
                        inputMode="decimal"
                        value={priceBelow}
                        onChange={(e) => setPriceBelow(e.target.value)}
                        placeholder="vd: 80000"
                        className={`${inputClass} pr-14`}
                      />
                      <span className="pointer-events-none absolute right-3 font-mono text-xs text-slate-500">USDT</span>
                    </div>
                  </div>

                  {rangeInvalid && (
                    <p className="flex items-center gap-1.5 text-[11px] text-amber-300">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      Giá trên phải lớn hơn giá dưới khi nhập cả hai.
                    </p>
                  )}
                  {!rangeInvalid && (
                    <p className="text-[11px] leading-relaxed text-slate-500">
                      Nếu nhập cả hai: giá trên phải lớn hơn giá dưới (dải giữa hai mức; báo khi vượt trên hoặc rơi dưới).
                    </p>
                  )}
                </div>
              </section>

              <section className="overflow-hidden rounded border border-slate-800 bg-slate-900">
                <header className="flex min-h-10 items-center justify-between gap-3 border-b border-slate-800 bg-slate-850/60 px-3 py-1">
                  <h3 className="text-[13px] font-semibold text-slate-200">Kênh thông báo</h3>
                  <span className="font-mono text-[11px] text-slate-500">phân phối tín hiệu</span>
                </header>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => setEnabled((v) => !v)}
                  className="flex min-h-14 w-full items-center justify-between gap-4 px-3 py-3 text-left transition-colors hover:bg-slate-850/40 sm:px-4"
                >
                  <span>
                    <span className="block text-sm font-medium text-slate-100">Bật cảnh báo theo ngưỡng</span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Worker đánh giá giá đóng nến và tạo thông báo trong app; Telegram gửi thêm nếu đã cấu hình.
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${enabled ? "bg-teal-500" : "bg-slate-700"}`}
                  >
                    <span
                      className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-4" : ""}`}
                    />
                  </span>
                </button>
              </section>

              <section className="overflow-hidden rounded border border-slate-800 bg-slate-900">
                <header className="flex min-h-10 items-center justify-between gap-3 border-b border-slate-800 bg-slate-850/60 px-3 py-1">
                  <h3 className="text-[13px] font-semibold text-slate-200">Tần suất &amp; giới hạn</h3>
                  <span className="font-mono text-[11px] text-slate-500">kiểm soát tải dữ liệu</span>
                </header>
                <div className="grid grid-cols-1 gap-4 p-3 sm:grid-cols-2 sm:p-4">
                  <div className="space-y-1.5">
                    <label htmlFor="kline-interval" className="block text-xs text-slate-400">Khung nến (giá đóng)</label>
                    <div className="relative">
                      <select
                        id="kline-interval"
                        value={klineInterval}
                        onChange={(e) => setKlineInterval(e.target.value)}
                        className={`${inputClass} appearance-none pr-9`}
                      >
                        {ACTIVE_TIMEFRAMES.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <label htmlFor="cooldown-minutes" className="block text-xs text-slate-400">Cooldown</label>
                      {cooldownInvalid && (
                        <span className="flex items-center gap-1 text-[11px] text-amber-300">
                          <AlertTriangle className="h-3 w-3" /> 1–1440 phút
                        </span>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <input
                        id="cooldown-minutes"
                        type="number"
                        min={1}
                        max={1440}
                        value={cooldownMinutes}
                        onChange={(e) => setCooldownMinutes(Number(e.target.value))}
                        className={`${inputClass} pr-14`}
                      />
                      <span className="pointer-events-none absolute right-3 font-mono text-xs text-slate-500">phút</span>
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 text-xs">
                  {error && <p className="whitespace-pre-wrap break-words text-rose-300">{error}</p>}
                  {!error && ok && (
                    <p className="flex items-center gap-1.5 text-slate-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" /> {ok}
                    </p>
                  )}
                  {!error && !ok && (!adminUnlocked || !contractCompatible) && (
                    <p className="text-slate-500">Thao tác ghi đang khóa; cần khóa quản trị và API contract tương thích.</p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={saving || !adminUnlocked || !contractCompatible}
                  onClick={() => void save()}
                  className="h-10 w-full shrink-0 rounded bg-teal-500 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 sm:w-auto"
                >
                  {saving ? "Đang lưu…" : "Lưu cấu hình"}
                </button>
              </div>
            </>
          )}
        </section>

        <aside className="space-y-4 lg:col-span-5">
          <ErrorBoundary fallbackTitle="Lỗi tải trạng thái hệ thống">
            <SystemStatusPanel />
          </ErrorBoundary>

          <TelegramSettingsPanel adminUnlocked={adminUnlocked} contractCompatible={contractCompatible} />
        </aside>
      </div>

      <ErrorBoundary fallbackTitle="Lỗi tải Bảng Quản trị Dữ liệu & Kiểm toán">
        <DataManagementPanel adminUnlocked={adminUnlocked} contractCompatible={contractCompatible} />
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Lỗi tải bản đồ năng lực kỹ thuật">
        <TechnicalCapabilitiesPanel />
      </ErrorBoundary>
    </div>
  );
}
