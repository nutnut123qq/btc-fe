"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, Trash2 } from "lucide-react";
import { BtcCandlestickChart } from "./BtcCandlestickChart";
import { SessionAccessPanel } from "./SessionAccessPanel";
import {
  getMbbCandles,
  getMbbConditions,
  getMbbDataQuality,
  getMbbDecision,
  getMbbPosition,
  putMbbPosition,
} from "@/lib/api";
import {
  MBB_ACTION_LABELS,
  MBB_TIMEFRAMES,
  formatMbbPct,
  formatShares,
  formatVnd,
  formatVnDateTime,
  mbbCandlesToKlines,
  normalizeMbbTimeframe,
  type MbbCoverageReport,
  type MbbDecision,
  type MbbPosition,
  type MbbTimeframe,
} from "@/lib/mbb";
import { getSessionKey } from "@/lib/sessionAuth";
import { getInstrument } from "@/lib/marketScope";
import { LatestRequestGate } from "@/lib/technicalReplay";
import type { KlineOHLC } from "@/lib/types";
import type { CurrentConditionsResponse } from "@/lib/currentConditions";
import { moduleLabel } from "@/lib/moduleLabels";

const INSTRUMENT = getInstrument("MBB");

const DIRECTION_LABEL: Record<string, string> = {
  bullish: "Tăng",
  bearish: "Giảm",
  neutral: "Trung lập",
};

const KIND_LABEL: Record<string, string> = {
  triggeredOnBar: "mới trên nến đóng gần nhất",
  state: "trạng thái hiện hữu",
  activeZone: "vùng đang hiệu lực",
  operativeLeg: "nhịp Fibonacci đang có hiệu lực",
};

/** Position-relative action semantics — sell never shorts, buy-more never exceeds cash. */
const ACTION_NOTE: Record<string, string> = {
  hold: "Không hành động — giữ nguyên vị thế hiện tại.",
  wait: "Không hành động — chờ đủ điều kiện hoặc đủ dữ liệu.",
  "buy-more": "Có thể mua thêm trong giới hạn tiền mặt và lô 100 cổ phiếu bên dưới.",
  reduce: "Đề xuất giảm một phần — chỉ bán được số cổ phiếu đã thanh toán (settled).",
  sell: "Đề xuất bán — chỉ bán được số cổ phiếu đã thanh toán (settled), không bán khống.",
  "conditional-sell": "Bán khi điều kiện kích hoạt — kiểm tra band ±7% và rủi ro không khớp bên dưới.",
};

type LotDraft = { quantity: string; costPerShareVnd: string; acquireDate: string };

function parseLotDrafts(lots: LotDraft[], cash: string): { error: string } | { body: { lots: { quantity: number; costPerShareVnd: number; acquireDate: string }[]; availableCashVnd: number } } {
  const parsedCash = Number.parseFloat(cash.replace(",", "."));
  if (cash.trim() === "" || !Number.isFinite(parsedCash) || parsedCash < 0) {
    return { error: "Tiền mặt khả dụng phải là số >= 0." };
  }
  const parsedLots = [];
  for (let index = 0; index < lots.length; index++) {
    const lot = lots[index];
    const quantity = Number.parseInt(lot.quantity.trim(), 10);
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      return { error: `Lô ${index + 1}: số lượng phải là số nguyên >= 1.` };
    }
    const cost = Number.parseFloat(lot.costPerShareVnd.trim().replace(",", "."));
    if (!Number.isFinite(cost) || cost <= 0) {
      return { error: `Lô ${index + 1}: giá vốn phải là số > 0.` };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lot.acquireDate.trim())) {
      return { error: `Lô ${index + 1}: ngày mua phải theo dạng yyyy-MM-dd.` };
    }
    parsedLots.push({ quantity, costPerShareVnd: cost, acquireDate: lot.acquireDate.trim() });
  }
  return { body: { lots: parsedLots, availableCashVnd: parsedCash } };
}

export function MbbScreen({ contractCompatible = false }: { contractCompatible?: boolean }) {
  const [timeframe, setTimeframe] = useState<MbbTimeframe>(normalizeMbbTimeframe(undefined));

  const [candles, setCandles] = useState<KlineOHLC[]>([]);
  const [candlesLoading, setCandlesLoading] = useState(true);
  const [candlesError, setCandlesError] = useState<string | null>(null);

  const [conditions, setConditions] = useState<CurrentConditionsResponse | null>(null);
  const [conditionsLoading, setConditionsLoading] = useState(true);
  const [conditionsError, setConditionsError] = useState<string | null>(null);

  const [decision, setDecision] = useState<MbbDecision | null>(null);
  const [decisionLoading, setDecisionLoading] = useState(true);
  const [decisionError, setDecisionError] = useState<string | null>(null);

  const [position, setPosition] = useState<MbbPosition | null>(null);
  const [positionLoading, setPositionLoading] = useState(true);
  const [positionError, setPositionError] = useState<string | null>(null);

  const [quality, setQuality] = useState<MbbCoverageReport | null>(null);
  const [qualityError, setQualityError] = useState<string | null>(null);

  // sessionStorage is client-only — initialize locked so SSR and the first
  // client render match, then sync the real state after mount.
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  useEffect(() => {
    setAdminUnlocked(Boolean(getSessionKey("admin")));
  }, []);
  const [lotDrafts, setLotDrafts] = useState<LotDraft[]>([]);
  const [cashDraft, setCashDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const [decisionEpoch, setDecisionEpoch] = useState(0);

  const candlesGate = useRef(new LatestRequestGate());
  const conditionsGate = useRef(new LatestRequestGate());
  const decisionGate = useRef(new LatestRequestGate());

  const loadCandles = useCallback(async (tf: MbbTimeframe) => {
    const token = candlesGate.current.begin();
    setCandlesLoading(true);
    setCandlesError(null);
    try {
      const data = await getMbbCandles({ timeframe: tf, limit: 500 });
      if (!candlesGate.current.isCurrent(token)) return;
      setCandles(mbbCandlesToKlines(data));
    } catch (e) {
      if (!candlesGate.current.isCurrent(token)) return;
      setCandles([]);
      setCandlesError(e instanceof Error ? e.message : "Không tải được nến MBB");
    } finally {
      if (candlesGate.current.isCurrent(token)) setCandlesLoading(false);
    }
  }, []);

  const loadConditions = useCallback(async (tf: MbbTimeframe) => {
    const token = conditionsGate.current.begin();
    setConditionsLoading(true);
    setConditionsError(null);
    try {
      const data = await getMbbConditions(tf);
      if (!conditionsGate.current.isCurrent(token)) return;
      if (data.timeframe !== tf) {
        setConditions(null);
        setConditionsError("Phản hồi timeframe không khớp yêu cầu.");
        return;
      }
      setConditions(data);
    } catch (e) {
      if (!conditionsGate.current.isCurrent(token)) return;
      setConditions(null);
      setConditionsError(e instanceof Error ? e.message : "Điều kiện hiện tại không khả dụng");
    } finally {
      if (conditionsGate.current.isCurrent(token)) setConditionsLoading(false);
    }
  }, []);

  const loadDecision = useCallback(async () => {
    const token = decisionGate.current.begin();
    setDecisionLoading(true);
    setDecisionError(null);
    try {
      const data = await getMbbDecision();
      if (!decisionGate.current.isCurrent(token)) return;
      setDecision(data);
    } catch (e) {
      if (!decisionGate.current.isCurrent(token)) return;
      setDecision(null);
      setDecisionError(e instanceof Error ? e.message : "Không tải được quyết định MBB");
    } finally {
      if (decisionGate.current.isCurrent(token)) setDecisionLoading(false);
    }
  }, []);

  const loadPosition = useCallback(async () => {
    setPositionLoading(true);
    setPositionError(null);
    try {
      const data = await getMbbPosition();
      setPosition(data);
      setLotDrafts(data.lots.map((lot) => ({
        quantity: String(lot.quantity),
        costPerShareVnd: String(lot.costPerShareVnd),
        acquireDate: lot.acquireDate,
      })));
      setCashDraft(String(data.availableCashVnd));
    } catch (e) {
      setPosition(null);
      setPositionError(e instanceof Error ? e.message : "Không tải được vị thế MBB");
    } finally {
      setPositionLoading(false);
    }
  }, []);

  const loadQuality = useCallback(async () => {
    setQualityError(null);
    try {
      setQuality(await getMbbDataQuality());
    } catch (e) {
      setQuality(null);
      setQualityError(e instanceof Error ? e.message : "Không tải được báo cáo chất lượng dữ liệu");
    }
  }, []);

  // LatestRequestGate drops in-flight responses for the previous timeframe —
  // the UI never renders candles/conditions from a stale selection.
  useEffect(() => {
    void loadCandles(timeframe);
    void loadConditions(timeframe);
  }, [timeframe, loadCandles, loadConditions]);

  useEffect(() => { void loadDecision(); }, [loadDecision, decisionEpoch]);
  useEffect(() => { void loadPosition(); }, [loadPosition]);
  useEffect(() => { void loadQuality(); }, [loadQuality]);

  const savePosition = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveOk(null);
    const parsed = parseLotDrafts(lotDrafts, cashDraft);
    if ("error" in parsed) {
      setSaveError(parsed.error);
      setSaving(false);
      return;
    }
    try {
      const next = await putMbbPosition(parsed.body);
      setPosition(next);
      setLotDrafts(next.lots.map((lot) => ({
        quantity: String(lot.quantity),
        costPerShareVnd: String(lot.costPerShareVnd),
        acquireDate: lot.acquireDate,
      })));
      setCashDraft(String(next.availableCashVnd));
      setSaveOk("Đã lưu vị thế — quyết định đang được tính lại.");
      setDecisionEpoch((n) => n + 1);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Lưu vị thế thất bại");
    } finally {
      setSaving(false);
    }
  };

  const staleTimeframes = (quality?.timeframes ?? []).filter((tf) => tf.isStale);
  const inputClass =
    "h-10 w-full rounded border border-slate-800 bg-slate-950 px-3 font-mono text-sm text-slate-100 placeholder:text-slate-600 transition-colors focus:border-teal-500 focus:outline-none disabled:opacity-50";

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight text-slate-100">MBB — MB Bank</h2>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">HOSE</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">VND</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">
              {INSTRUMENT?.dataProvider ?? "VCI"} · cross-check {INSTRUMENT?.crossCheckDataProvider ?? "KBS"}
            </span>
            <span className="rounded bg-teal-500/10 px-1.5 py-0.5 font-mono text-[11px] text-teal-300">
              giá {INSTRUMENT?.priceBasis ?? "adjusted"}
            </span>
          </div>
          <p className="mt-0.5 text-[13px] text-slate-400">
            Cổ phiếu HOSE theo phiên giờ Việt Nam · khung 1h/1d · dữ liệu nguồn VCI, giá đã điều chỉnh quyền.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/"
            className="inline-flex min-h-9 items-center rounded border border-slate-700 px-3 text-xs font-medium text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100"
          >
            BTC/USDT
          </Link>
          <button
            type="button"
            onClick={() => {
              void loadCandles(timeframe);
              void loadConditions(timeframe);
              void loadDecision();
              void loadPosition();
              void loadQuality();
            }}
            className="inline-flex min-h-9 items-center gap-1.5 px-1 text-xs text-slate-400 transition-colors hover:text-slate-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Làm mới
          </button>
        </div>
      </header>

      {staleTimeframes.length > 0 && (
        <p className="border-l-2 border-amber-500/70 bg-amber-950/20 px-3 py-2 text-xs text-amber-200" role="alert">
          Dữ liệu {staleTimeframes.map((tf) => tf.timeframe).join("/")} đang cũ (stale) — nến mới nhất chưa khớp kỳ vọng của lịch phiên; các chỉ số bên dưới có thể lệch thời điểm.
        </p>
      )}
      {qualityError && (
        <p className="border-l-2 border-slate-600 bg-slate-900 px-3 py-2 text-xs text-slate-400" role="alert">
          Không tải được báo cáo chất lượng dữ liệu: {qualityError}
        </p>
      )}

      <section className="overflow-hidden rounded border border-slate-800 bg-slate-900" aria-labelledby="mbb-chart-title">
        <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-3 py-1">
          <h3 id="mbb-chart-title" className="text-[13px] font-semibold text-slate-200">Đồ thị nến MBB</h3>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">nến cuối có thể đang hình thành theo phiên HOSE</span>
            <div role="group" aria-label="Khung thời gian MBB" className="flex overflow-hidden rounded border border-slate-700">
              {MBB_TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  aria-pressed={timeframe === tf}
                  onClick={() => setTimeframe(tf as MbbTimeframe)}
                  className={`min-h-8 px-3 text-xs font-medium transition-colors ${
                    timeframe === tf ? "bg-teal-500/20 text-teal-300" : "bg-slate-950 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-3">
          {candlesLoading && <p className="text-sm text-slate-500">Đang tải nến {timeframe}…</p>}
          {!candlesLoading && candlesError && (
            <div className="flex items-center gap-3 rounded border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-200" role="alert">
              <span className="min-w-0 flex-1 break-words">Không tải được nến MBB: {candlesError}</span>
              <button type="button" onClick={() => void loadCandles(timeframe)} className="min-h-9 shrink-0 rounded px-2.5 py-1.5 font-semibold hover:bg-rose-950/60">Thử lại</button>
            </div>
          )}
          {!candlesLoading && !candlesError && candles.length === 0 && (
            <p className="text-sm text-slate-500">Chưa có nến {timeframe} cho MBB trong kho dữ liệu.</p>
          )}
          {candles.length > 0 && (
            <BtcCandlestickChart data={candles} timeframe={timeframe} height={380} />
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded border border-slate-800 bg-slate-900" aria-labelledby="mbb-conditions-title">
          <div className="flex min-h-10 items-center justify-between gap-2 border-b border-slate-800 px-3 py-1">
            <h3 id="mbb-conditions-title" className="text-[13px] font-semibold text-slate-200">Điều kiện hiện tại ({timeframe})</h3>
            <button type="button" onClick={() => void loadConditions(timeframe)} disabled={conditionsLoading} className="inline-flex min-h-9 items-center px-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-50" aria-label="Làm mới điều kiện MBB">
              <RefreshCw className={`h-3.5 w-3.5 ${conditionsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="p-3">
            {conditionsLoading && <p className="text-sm text-slate-500">Đang tải điều kiện…</p>}
            {!conditionsLoading && conditionsError && (
              <div className="flex items-center gap-3 rounded border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-xs text-amber-200" role="alert">
                <span className="min-w-0 flex-1 break-words">Điều kiện hiện tại chưa khả dụng: {conditionsError}</span>
                <button type="button" onClick={() => void loadConditions(timeframe)} className="min-h-9 shrink-0 rounded px-2.5 py-1.5 font-semibold hover:bg-amber-950/60">Thử lại</button>
              </div>
            )}
            {!conditionsLoading && !conditionsError && conditions && (
              <div className="space-y-3">
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-slate-500">Nến được phân tích (asOf)</dt>
                    <dd className="mt-0.5 font-mono tabular-nums text-slate-200">{formatVnDateTime(conditions.asOfMs)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Evidence</dt>
                    <dd className="mt-0.5 text-slate-200">
                      {conditions.evidence.available
                        ? `Có · cutoff ${formatVnDateTime(conditions.evidence.cutoffMs)}`
                        : `Không — ${conditions.evidence.reason ?? "không rõ lý do"}`}
                    </dd>
                  </div>
                </dl>
                {conditions.warnings.length > 0 && (
                  <ul className="space-y-1">
                    {conditions.warnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-1.5 text-[11px] text-amber-300">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {warning}
                      </li>
                    ))}
                  </ul>
                )}
                {conditions.unavailableModules.length > 0 && (
                  <p className="text-[11px] text-slate-500">
                    Module không khả dụng: {conditions.unavailableModules.map((m) => `${moduleLabel(m.module)} (${m.reason})`).join("; ")}
                  </p>
                )}
                {conditions.conditions.length === 0 ? (
                  <p className="text-xs text-slate-500">Không có điều kiện nào đang thoả trên khung {timeframe}.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {conditions.conditions.map((condition, index) => (
                      <li key={`${condition.module}:${condition.eventId ?? condition.eventType}:${index}`} className="rounded border border-slate-800 bg-slate-950/60 px-2.5 py-2">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="font-medium text-slate-200">{moduleLabel(condition.module)}</span>
                          <span className="font-mono text-[11px] text-slate-500">{condition.eventType}</span>
                          <span className={`rounded px-1.5 py-0.5 text-[11px] ${condition.direction === "bullish" ? "bg-emerald-950/40 text-emerald-300" : condition.direction === "bearish" ? "bg-rose-950/40 text-rose-300" : "bg-slate-800/60 text-slate-400"}`}>
                            {DIRECTION_LABEL[condition.direction] ?? condition.direction}
                          </span>
                          <span className="text-[11px] text-slate-500">{KIND_LABEL[condition.kind] ?? condition.kind}</span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-slate-500">
                          hình thành {formatVnDateTime(condition.formedTimeMs)} · khả dụng {formatVnDateTime(condition.availableTimeMs)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded border border-slate-800 bg-slate-900" aria-labelledby="mbb-decision-title" data-testid="mbb-decision">
          <div className="flex min-h-10 items-center justify-between gap-2 border-b border-slate-800 px-3 py-1">
            <h3 id="mbb-decision-title" className="text-[13px] font-semibold text-slate-200">Quyết định đề xuất</h3>
            {decision && (
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 font-mono text-[11px] text-amber-300" title="Quy tắc định lượng chưa qua kiểm chứng walk-forward">
                {decision.evidenceStatus} · chưa validated
              </span>
            )}
          </div>
          <div className="p-3">
            {decisionLoading && <p className="text-sm text-slate-500">Đang tính quyết định…</p>}
            {!decisionLoading && decisionError && (
              <div className="flex items-center gap-3 rounded border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-200" role="alert">
                <span className="min-w-0 flex-1 break-words">Không tải được quyết định: {decisionError}</span>
                <button type="button" onClick={() => void loadDecision()} className="min-h-9 shrink-0 rounded px-2.5 py-1.5 font-semibold hover:bg-rose-950/60">Thử lại</button>
              </div>
            )}
            {!decisionLoading && !decisionError && decision && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className={`rounded px-2 py-1 text-sm font-semibold ${
                    decision.action === "sell" || decision.action === "reduce" || decision.action === "conditional-sell"
                      ? "bg-rose-950/50 text-rose-300"
                      : decision.action === "buy-more"
                        ? "bg-emerald-950/50 text-emerald-300"
                        : "bg-slate-800 text-slate-200"
                  }`}>
                    {MBB_ACTION_LABELS[decision.action]}
                  </span>
                  <span className="text-[11px] text-slate-500">tính lúc {formatVnDateTime(Date.parse(decision.generatedAtUtc))} · basis {decision.priceBasis}</span>
                </div>
                <p className="text-xs text-slate-400">{ACTION_NOTE[decision.action]}</p>
                {decision.reasons.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-xs text-slate-300">
                    {decision.reasons.map((reason, index) => <li key={index}>{reason}</li>)}
                  </ul>
                )}
                {decision.triggers.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Điều kiện kích hoạt</p>
                    {decision.triggers.map((trigger, index) => (
                      <div key={index} className="rounded border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium text-slate-200">{trigger.name}</span>
                          <span className="font-mono text-[11px] text-slate-500">{trigger.timeframe}</span>
                          {trigger.priceLevelVnd != null && (
                            <span className="font-mono text-[11px] text-slate-300">@ {formatVnd(trigger.priceLevelVnd)}</span>
                          )}
                          {trigger.withinPriceBand === true && <span className="rounded bg-emerald-950/40 px-1 text-[10px] text-emerald-300">trong band ±7%</span>}
                          {trigger.withinPriceBand === false && <span className="rounded bg-rose-950/40 px-1 text-[10px] text-rose-300">ngoài band ±7% — lệnh sẽ bị từ chối</span>}
                          {trigger.withinPriceBand == null && <span className="rounded bg-slate-800 px-1 text-[10px] text-slate-400">chưa kiểm tra band</span>}
                        </div>
                        <p className="mt-0.5 text-slate-400">{trigger.condition}</p>
                        {trigger.nonFillRisk && (
                          <p className="mt-0.5 flex items-start gap-1 text-[11px] text-amber-300">
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> Rủi ro không khớp: {trigger.nonFillRisk}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {decision.invalidation && (
                  <p className="text-xs text-slate-400"><span className="font-medium text-slate-300">Mất hiệu lực khi:</span> {decision.invalidation}</p>
                )}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
                  <div><dt className="text-slate-500">Tổng CP</dt><dd className="font-mono tabular-nums text-slate-200">{formatShares(decision.position.totalShares)}</dd></div>
                  <div><dt className="text-slate-500">Bán được ngay (T+2)</dt><dd className="font-mono tabular-nums text-slate-200">{formatShares(decision.position.sellableSharesNow)}</dd></div>
                  <div><dt className="text-slate-500">Chờ thanh toán</dt><dd className="font-mono tabular-nums text-slate-200">{formatShares(decision.position.pendingShares)}</dd></div>
                  <div><dt className="text-slate-500">Giá vốn TB</dt><dd className="font-mono tabular-nums text-slate-200">{formatVnd(decision.position.avgCostPerShareVnd)}</dd></div>
                  <div><dt className="text-slate-500">Giá gần nhất</dt><dd className="font-mono tabular-nums text-slate-200">{formatVnd(decision.position.lastPriceVnd)}</dd></div>
                  <div><dt className="text-slate-500">PnL chưa chốt</dt><dd className="font-mono tabular-nums text-slate-200">{formatVnd(decision.position.unrealizedPnlVnd)} ({formatMbbPct(decision.position.unrealizedPnlPct)})</dd></div>
                  {decision.position.netProceedsIfSellableNowVnd != null && (
                    <div className="col-span-2"><dt className="text-slate-500">Tiền về nếu bán hết phần bán được (sau phí 0.15% + thuế 0.1%)</dt><dd className="font-mono tabular-nums text-slate-200">{formatVnd(decision.position.netProceedsIfSellableNowVnd)}</dd></div>
                  )}
                </dl>
                {decision.buyMore && (
                  <p className="rounded border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-300">
                    Sức mua thêm: tối đa {formatShares(decision.buyMore.maxBuyableShares)} ({decision.buyMore.maxBuyableLots} lô 100) ≈ {formatVnd(decision.buyMore.estimatedCostVnd)}.
                  </p>
                )}
                {decision.dataFreshness.some((f) => f.isStale) && (
                  <p className="flex items-start gap-1.5 text-[11px] text-amber-300">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    Dữ liệu {decision.dataFreshness.filter((f) => f.isStale).map((f) => f.timeframe).join("/")} cũ — quyết định có thể lệch thời điểm.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>


      <section className="overflow-hidden rounded border border-slate-800 bg-slate-900" aria-labelledby="mbb-position-title" data-testid="mbb-position-form">
        <div className="flex min-h-10 items-center justify-between gap-2 border-b border-slate-800 px-3 py-1">
          <h3 id="mbb-position-title" className="text-[13px] font-semibold text-slate-200">Vị thế MBB (nhập tay)</h3>
          <span className="font-mono text-[11px] text-slate-500">lô 100 · T+2 · phí 0.15% · thuế bán 0.1%</span>
        </div>
        <div className="space-y-3 p-3">
          <SessionAccessPanel kind="admin" label="Quyền quản trị (ghi vị thế)" onChange={setAdminUnlocked} />
          {positionLoading && <p className="text-sm text-slate-500">Đang tải vị thế…</p>}
          {!positionLoading && positionError && (
            <div className="flex items-center gap-3 rounded border border-rose-900/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-200" role="alert">
              <span className="min-w-0 flex-1 break-words">Không tải được vị thế: {positionError}</span>
              <button type="button" onClick={() => void loadPosition()} className="min-h-9 shrink-0 rounded px-2.5 py-1.5 font-semibold hover:bg-rose-950/60">Thử lại</button>
            </div>
          )}
          {!positionLoading && position && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
              <div><dt className="text-slate-500">Tổng CP</dt><dd className="font-mono tabular-nums text-slate-200">{formatShares(position.totalShares)}</dd></div>
              <div><dt className="text-slate-500">Đã thanh toán</dt><dd className="font-mono tabular-nums text-slate-200">{formatShares(position.settledShares)}</dd></div>
              <div><dt className="text-slate-500">Chờ T+2</dt><dd className="font-mono tabular-nums text-slate-200">{formatShares(position.pendingShares)}</dd></div>
              <div><dt className="text-slate-500">Giá vốn TB</dt><dd className="font-mono tabular-nums text-slate-200">{formatVnd(position.avgCostPerShareVnd)}</dd></div>
            </dl>
          )}

          <div className="space-y-2">
            {lotDrafts.map((lot, index) => (
              <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
                <div>
                  <label htmlFor={`mbb-lot-qty-${index}`} className="block text-[11px] text-slate-500">Số lượng (cp)</label>
                  <input
                    id={`mbb-lot-qty-${index}`}
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={lot.quantity}
                    onChange={(e) => setLotDrafts((prev) => prev.map((l, i) => (i === index ? { ...l, quantity: e.target.value } : l)))}
                    className={inputClass}
                    placeholder="vd: 200"
                  />
                </div>
                <div>
                  <label htmlFor={`mbb-lot-cost-${index}`} className="block text-[11px] text-slate-500">Giá vốn/cổ (₫)</label>
                  <input
                    id={`mbb-lot-cost-${index}`}
                    type="text"
                    inputMode="decimal"
                    value={lot.costPerShareVnd}
                    onChange={(e) => setLotDrafts((prev) => prev.map((l, i) => (i === index ? { ...l, costPerShareVnd: e.target.value } : l)))}
                    className={inputClass}
                    placeholder="vd: 24500"
                  />
                </div>
                <div>
                  <label htmlFor={`mbb-lot-date-${index}`} className="block text-[11px] text-slate-500">Ngày mua</label>
                  <input
                    id={`mbb-lot-date-${index}`}
                    type="date"
                    value={lot.acquireDate}
                    onChange={(e) => setLotDrafts((prev) => prev.map((l, i) => (i === index ? { ...l, acquireDate: e.target.value } : l)))}
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setLotDrafts((prev) => prev.filter((_, i) => i !== index))}
                  className="flex h-10 w-10 items-center justify-center rounded border border-slate-800 text-slate-500 transition-colors hover:border-rose-800 hover:text-rose-300"
                  aria-label={`Xoá lô ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLotDrafts((prev) => [...prev, { quantity: "", costPerShareVnd: "", acquireDate: "" }])}
              className="min-h-9 rounded border border-dashed border-slate-700 px-3 text-xs text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200"
            >
              + Thêm lô
            </button>
          </div>

          <div className="max-w-xs">
            <label htmlFor="mbb-cash" className="block text-[11px] text-slate-500">Tiền mặt khả dụng (₫)</label>
            <input
              id="mbb-cash"
              type="text"
              inputMode="decimal"
              value={cashDraft}
              onChange={(e) => setCashDraft(e.target.value)}
              className={inputClass}
              placeholder="vd: 5000000"
            />
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 text-xs">
              {saveError && <p className="whitespace-pre-wrap break-words text-rose-300">{saveError}</p>}
              {!saveError && saveOk && (
                <p className="flex items-center gap-1.5 text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-teal-500" /> {saveOk}
                </p>
              )}
              {!saveError && !saveOk && (!adminUnlocked || !contractCompatible) && (
                <p className="text-slate-500">Ghi vị thế đang khóa; cần khóa quản trị và API contract tương thích.</p>
              )}
            </div>
            <button
              type="button"
              disabled={saving || !adminUnlocked || !contractCompatible}
              onClick={() => void savePosition()}
              className="h-10 w-full shrink-0 rounded bg-teal-500 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 sm:w-auto"
            >
              {saving ? "Đang lưu…" : "Lưu vị thế"}
            </button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded border border-slate-800 bg-slate-900" aria-labelledby="mbb-quality-title">
        <div className="flex min-h-10 items-center justify-between gap-2 border-b border-slate-800 px-3 py-1">
          <h3 id="mbb-quality-title" className="text-[13px] font-semibold text-slate-200">Chất lượng dữ liệu</h3>
          {quality && (
            <span className="font-mono text-[11px] text-slate-500">
              {quality.provider} + {quality.crossCheckProvider} · {quality.venue} · {quality.priceBasis}
            </span>
          )}
        </div>
        <div className="p-3">
          {!quality && !qualityError && <p className="text-sm text-slate-500">Đang tải báo cáo…</p>}
          {quality && (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
                      <th className="py-1.5 pr-3 font-medium">Khung</th>
                      <th className="py-1.5 pr-3 font-medium">Coverage</th>
                      <th className="py-1.5 pr-3 font-medium">Nến</th>
                      <th className="py-1.5 pr-3 font-medium">Thiếu</th>
                      <th className="py-1.5 pr-3 font-medium">Gap</th>
                      <th className="py-1.5 pr-3 font-medium">Ngoài phiên</th>
                      <th className="py-1.5 font-medium">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quality.timeframes.map((tf) => (
                      <tr key={tf.timeframe} className="border-b border-slate-800/60 text-slate-300">
                        <td className="py-1.5 pr-3 font-mono">{tf.timeframe}</td>
                        <td className="py-1.5 pr-3 font-mono tabular-nums">{formatMbbPct(tf.coveragePct, 1)}</td>
                        <td className="py-1.5 pr-3 font-mono tabular-nums">{tf.totalBars.toLocaleString("vi-VN")}/{tf.expectedBars.toLocaleString("vi-VN")}</td>
                        <td className="py-1.5 pr-3 font-mono tabular-nums">{tf.missingBars.toLocaleString("vi-VN")}</td>
                        <td className="py-1.5 pr-3 font-mono tabular-nums">{tf.gapRangeCount}</td>
                        <td className="py-1.5 pr-3 font-mono tabular-nums">{tf.unexpectedSessionBars}</td>
                        <td className="py-1.5">
                          {tf.isStale
                            ? <span className="rounded bg-amber-950/50 px-1.5 py-0.5 text-[10px] text-amber-300">stale</span>
                            : <span className="rounded bg-emerald-950/40 px-1.5 py-0.5 text-[10px] text-emerald-300">fresh</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {quality.limitations.length > 0 && (
                <ul className="space-y-1">
                  {quality.limitations.map((limitation, index) => (
                    <li key={index} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-slate-600" /> {limitation}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
