"use client";

import { useState, useCallback } from "react";
import {
  Database,
  RefreshCw,
  Play,
  Flame,
  Layers,
  BarChart3,
  Search,
  Cpu,
  FileSearch,
} from "lucide-react";
import {
  getDataAudit,
  backfillKlines,
  warmupPatternIndex,
  indexTechnicalIndicators,
  rebuildMlDatasetFromIndexer,
  getRagNewsContext,
  getTechSummary,
  retryDataGap,
} from "@/lib/api";
import type {
  DataAuditResponse,
  BackfillStartInfo,
  KlineGapAuditItem,
} from "@/lib/types";
import { ACTIVE_TIMEFRAMES, DEFAULT_TIMEFRAME, isActiveTimeframe, type ActiveTimeframe } from "@/lib/timeframe";
import { ACTIVE_SYMBOL } from "@/lib/marketScope";

function ageLabel(seconds: number | null): string {
  if (seconds == null) return "--";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

function gapStatusClass(status: KlineGapAuditItem["status"]): string {
  if (status === "Unavailable") return "text-rose-300 bg-rose-950/40";
  if (status === "Pending") return "text-slate-300 bg-slate-800/40";
  return "text-slate-400 bg-slate-800/40";
}

export function DataManagementPanel({
  adminUnlocked = false,
  contractCompatible = false,
}: {
  adminUnlocked?: boolean;
  contractCompatible?: boolean;
}) {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(ACTIVE_SYMBOL);
  const [selectedTf, setSelectedTf] = useState<ActiveTimeframe>(DEFAULT_TIMEFRAME);
  const [auditData, setAuditData] = useState<DataAuditResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Diagnostic Context Testers
  const [ragQuery, setRagQuery] = useState("Bitcoin ETF inflow market regulation");
  const [ragResult, setRagResult] = useState<string>("");
  const [techResult, setTechResult] = useState<string>("");

  const loadAudit = useCallback(async () => {
    setLoading(true);
    setAuditError(null);
    try {
      setAuditData(await getDataAudit(selectedSymbol, AbortSignal.timeout(10_000)));
    } catch (err: unknown) {
      setAuditError(
        err instanceof DOMException && err.name === "TimeoutError"
          ? "Data Audit phản hồi quá 10 giây. Hãy thử lại khi backend bớt tải."
          : err instanceof Error
            ? err.message
            : "Không tải được Data Audit",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol]);

  const handleBackfill = async (fillGaps = false, timeframe: ActiveTimeframe = selectedTf) => {
    if (fillGaps && !window.confirm(`Chạy backfill gaps cho ${selectedSymbol} (${timeframe})?`)) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const res: BackfillStartInfo = await backfillKlines({
        symbol: selectedSymbol,
        timeframe,
        fillGaps,
        requestsPerMinuteLimit: 300,
        wait: false,
      });
      setMessage({
        type: "success",
        text: `✅ Đã kích hoạt Backfill nến (${res.status}): ${res.message || "Đang chạy nền..."}`,
      });
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Kích hoạt Backfill thất bại",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryGap = async (gap: KlineGapAuditItem) => {
    if (gap.id == null || (gap.status !== "Pending" && gap.status !== "Unavailable")) return;
    if (!window.confirm(`Đặt lại lịch retry cho gap #${gap.id} (${gap.missingBars.toLocaleString()} nến)?`)) return;
    setActionLoading(true);
    setMessage(null);
    try {
      await retryDataGap(gap.id);
      setMessage({ type: "success", text: `Đã đưa gap #${gap.id} về trạng thái Pending.` });
      await loadAudit();
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Retry gap thất bại" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReindexTech = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      await indexTechnicalIndicators(selectedSymbol, selectedTf);
      setMessage({ type: "success", text: `✅ Đã re-index Technical Indicators cho ${selectedSymbol} (${selectedTf})` });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Re-index Technical thất bại" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReindexMl = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      await rebuildMlDatasetFromIndexer(selectedSymbol, selectedTf);
      setMessage({ type: "success", text: `✅ Đã rebuild ML Feature Dataset cho ${selectedSymbol} (${selectedTf})` });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Rebuild ML Dataset thất bại" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleWarmupPatternIndex = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      await warmupPatternIndex({ symbol: selectedSymbol, timeframe: selectedTf, lookbackBars: 3000 });
      setMessage({ type: "success", text: `✅ Đã warmup Pattern Vector Index cho ${selectedSymbol} (${selectedTf})` });
      await loadAudit();
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Warmup thất bại" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestRag = async () => {
    try {
      const res = await getRagNewsContext(ragQuery, 4);
      setRagResult(res.news_context || "Không tìm thấy đoạn tin phù hợp");
    } catch (err: unknown) {
      setRagResult(`Lỗi: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleTestTechSummary = async () => {
    try {
      const res = await getTechSummary(selectedSymbol, selectedTf, 48);
      setTechResult(res.tech_context || "Không có tóm tắt kỹ thuật");
    } catch (err: unknown) {
      setTechResult(`Lỗi: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const topGaps = auditData?.timeframes.flatMap((tf) =>
    tf.topGaps.map((gap, index) => ({ ...gap, timeframe: tf.timeframe, rowKey: `${tf.timeframe}-${gap.id ?? index}` })),
  ) ?? [];

  return (
    <div className="overflow-hidden rounded border border-slate-800 bg-slate-900 text-xs">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-800 bg-slate-850/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-3.5 w-3.5 shrink-0 text-slate-500" />
          <div>
            <h3 className="text-[13px] font-semibold text-slate-200">
              Lab · Quản trị dữ liệu &amp; kiểm toán indexer
            </h3>
            <p className="text-[11px] text-slate-500">
              Kiểm tra độ đầy đủ nến, phát hiện gaps, chạy backfill và rebuild các pipeline đặc trưng AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSymbol}
            onChange={(e) => {
              setSelectedSymbol(e.target.value);
              setAuditData(null);
              setAuditError(null);
            }}
            className="h-10 rounded border border-slate-800 bg-slate-950 px-2.5 font-mono text-xs font-semibold text-slate-200 focus:border-teal-500 focus:outline-none"
          >
            <option value="BTCUSDT">BTC/USDT</option>
          </select>

          <select
            value={selectedTf}
            onChange={(e) => setSelectedTf(e.target.value as ActiveTimeframe)}
            className="h-10 rounded border border-slate-800 bg-slate-950 px-2.5 font-mono text-xs text-slate-200 focus:border-teal-500 focus:outline-none"
          >
            {ACTIVE_TIMEFRAMES.map((timeframe) => (
              <option key={timeframe} value={timeframe}>{timeframe}</option>
            ))}
          </select>

          <button
            onClick={() => void loadAudit()}
            disabled={loading}
            className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-800 text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200 disabled:opacity-50"
            title="Làm mới báo cáo audit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`flex items-center justify-between gap-2 border-b border-slate-800 px-3 py-2 ${
            message.type === "success"
              ? "bg-emerald-950/20 text-emerald-300"
              : "bg-rose-950/20 text-rose-300"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="shrink-0 px-1 text-slate-400 hover:text-slate-200 text-xs">
            Đóng
          </button>
        </div>
      )}

      {/* Section 1: Data Audit Table */}
      <div className="space-y-2 p-3 sm:p-4">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <FileSearch className="w-3.5 h-3.5 text-slate-500" />
          Báo cáo kiểm toán nến &amp; độ phủ dữ liệu ({selectedSymbol})
        </h4>

        {loading ? (
          <div className="space-y-2 rounded border border-slate-800 bg-slate-950/40 p-3" role="status" aria-label="Đang tải Data Audit">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-8 rounded bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : auditError ? (
          <div className="border-l-2 border-rose-600/70 bg-rose-950/20 px-3 py-3 text-rose-300">
            {auditError}
          </div>
        ) : auditData ? (
          <div className="overflow-x-auto rounded border border-slate-800">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-slate-950 text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="p-2">Khung (TF)</th>
                  <th className="p-2 text-right">Tổng số nến</th>
                  <th className="p-2 text-right">Thiếu nến</th>
                  <th className="p-2 text-right">Khoảng gap</th>
                  <th className="p-2 text-right">Pending</th>
                  <th className="p-2 text-right">Unavailable</th>
                  <th className="p-2 text-right">Gap ledger</th>
                  <th className="p-2 text-right">Độ phủ (%)</th>
                  <th className="p-2 text-right">Tuổi nến cuối</th>
                  <th className="p-2 text-right">Derived inventory</th>
                  <th className="p-2 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {auditData.timeframes?.map((tf) => {
                  const active = isActiveTimeframe(tf.timeframe);
                  return (
                  <tr key={tf.timeframe} className={active ? "hover:bg-slate-800/30" : "bg-slate-950/40 text-slate-400"}>
                    <td className="p-2 font-bold text-slate-200">
                      {tf.timeframe}
                      {!active && <span className="ml-1 text-[9px] font-normal text-slate-400">lịch sử</span>}
                    </td>
                    <td className="p-2 text-right text-slate-300">{tf.totalKlines?.toLocaleString()}</td>
                    <td className={`p-2 text-right ${tf.missingBars > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                      {tf.missingBars.toLocaleString()}
                    </td>
                    <td className="p-2 text-right text-slate-300">{tf.gapRangeCount.toLocaleString()}</td>
                    <td className="p-2 text-right text-slate-300">{tf.pendingGapCount}</td>
                    <td className="p-2 text-right text-rose-300">{tf.unavailableGapCount}</td>
                    <td className={`p-2 text-right font-semibold ${tf.gapLedgerStatus === "Reconciled" ? "text-emerald-400" : "text-slate-300"}`}>
                      {tf.gapLedgerStatus === "Reconciled" ? "Đã đối soát" : "Tính trực tiếp · suy giảm"}
                    </td>
                    <td className="p-2 text-right">
                      <span
                        className={
                          tf.dataCoveragePct >= 99
                            ? "text-emerald-400 font-bold"
                            : tf.dataCoveragePct >= 95
                            ? "text-slate-400"
                            : "text-rose-400"
                        }
                      >
                        {tf.dataCoveragePct?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right text-slate-400">{ageLabel(tf.latestCandleAgeSeconds)}</td>
                    <td className="p-2 text-right text-slate-400">
                      {tf.candlePatterns == null
                        ? "Chưa tải (fast audit)"
                        : `${tf.candlePatterns.toLocaleString()} patterns · ${tf.technicalIndicators?.toLocaleString() ?? "--"} indicators`}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => {
                          if (isActiveTimeframe(tf.timeframe)) {
                            void handleBackfill(true, tf.timeframe);
                          }
                        }}
                        disabled={actionLoading || !adminUnlocked || !contractCompatible || !active}
                        className="min-h-10 rounded border border-teal-800/60 bg-teal-950/40 px-2.5 py-1 text-[10px] font-semibold text-teal-300 transition-colors hover:bg-teal-950/70 disabled:opacity-40"
                      >
                        Lấp gaps
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-t border-slate-800 bg-slate-950/60 p-2">
              <div className="mb-2 text-[11px] text-slate-500">
                Top gaps đã phân loại. Unavailable vẫn là dữ liệu thiếu; retry chỉ đặt lại lịch thử, không đánh dấu đã lấp.
              </div>
              <div className="space-y-1.5">
                {topGaps.length === 0 ? (
                  <div className="text-xs text-slate-400">Không có gap ưu tiên cần hiển thị.</div>
                ) : topGaps.map((gap) => (
                  <div key={gap.rowKey} className={`flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800/70 p-2 text-xs ${gapStatusClass(gap.status)}`}>
                    <div>
                      <span className="font-bold">{gap.timeframe}</span> · {gap.missingBars.toLocaleString()} nến · {gap.status ?? "Untracked"}
                      <span className="ml-2 opacity-75">thử {gap.attemptCount} lần{gap.reason ? ` · ${gap.reason}` : ""}</span>
                    </div>
                    {(gap.status === "Pending" || gap.status === "Unavailable") && gap.id != null && (
                      <button
                        type="button"
                        onClick={() => void handleRetryGap(gap)}
                        disabled={actionLoading || !adminUnlocked || !contractCompatible || !isActiveTimeframe(gap.timeframe)}
                        className="min-h-10 rounded border border-slate-700 bg-slate-950/60 px-3 py-1 font-semibold transition-colors hover:border-slate-600 disabled:opacity-40"
                      >
                        Retry có xác nhận
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-800 bg-slate-950/60 p-3 space-y-2">
              <div className="text-xs font-semibold text-slate-400">Chất lượng nến &amp; lineage derived</div>
              <div className="grid gap-2 md:grid-cols-3">
                {auditData.timeframes.map((tf) => (
                  <div key={`quality-${tf.timeframe}`} className="rounded border border-slate-800 bg-slate-950/40 p-2 text-xs text-slate-400">
                    <div className="font-bold text-slate-300">{tf.timeframe}</div>
                    {tf.quality ? (
                      <>
                        <div>Finalized {tf.quality.finalizedRows.toLocaleString()} · forming {tf.quality.formingRows.toLocaleString()}</div>
                        <div className={tf.quality.invalidOhlcvRows || tf.quality.invalidDurationRows || tf.quality.duplicateOpenTimeRows ? "text-rose-300" : "text-emerald-400"}>
                          OHLCV lỗi {tf.quality.invalidOhlcvRows.toLocaleString()} · duration lỗi {tf.quality.invalidDurationRows.toLocaleString()} · duplicate {tf.quality.duplicateOpenTimeRows.toLocaleString()}
                        </div>
                        <div className={tf.quality.isStale ? "text-amber-300" : "text-slate-400"}>Finalized age {ageLabel(tf.quality.latestFinalizedAgeSeconds)}{tf.quality.isStale ? " · stale" : ""}</div>
                      </>
                    ) : <div className="text-amber-300">Backend cũ: chưa có quality audit</div>}
                    <div className="mt-1 pt-1">
                      {(tf.derivedTables ?? []).length > 0
                        ? (tf.derivedTables ?? []).map((table) => (
                          <div key={table.table}>{table.table}: {table.rows.toLocaleString()} rows · missing {table.missingRows ?? "n/a"} · age {ageLabel(table.latestAgeSeconds)}</div>
                        ))
                        : <span>Derived lineage chưa có</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
              <div className="font-semibold text-slate-300">Derivatives audit</div>
              {auditData.derivatives ? (
                <div className="mt-1 space-y-1 font-mono text-[11px]">
                  <div>Futures raw: {auditData.derivatives.futuresMetrics.rows.toLocaleString()} rows · duplicate {auditData.derivatives.futuresMetrics.duplicateOpenTimeRows.toLocaleString()} · age {ageLabel(auditData.derivatives.futuresMetrics.latestAgeSeconds)}</div>
                  <div>Missing fields: OI {auditData.derivatives.futuresMetrics.missingOpenInterest.toLocaleString()} · L/S {auditData.derivatives.futuresMetrics.missingLongShortRatio.toLocaleString()} · taker {auditData.derivatives.futuresMetrics.missingTakerRatio.toLocaleString()} · funding {auditData.derivatives.futuresMetrics.missingFundingRate.toLocaleString()} · mark {auditData.derivatives.futuresMetrics.missingMarkPrice.toLocaleString()}</div>
                  <div className="font-sans text-amber-300">{auditData.derivatives.availabilityCaveat}</div>
                </div>
              ) : <div className="mt-1 text-amber-300">Backend cũ: chưa có derivatives quality audit; không suy diễn missing = 0.</div>}
            </div>
          </div>
        ) : (
          <div className="rounded border border-slate-800 bg-slate-950/40 p-4 text-center text-slate-500">
            Chưa có báo cáo audit. Bấm làm mới để tải.
          </div>
        )}
      </div>

      {/* Section 2: Indexers & Rebuild Pipeline Controls */}
      <div className="space-y-2 border-t border-slate-800 bg-slate-950/40 p-3 sm:p-4">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-slate-500" />
          Điều phối pipeline indexing &amp; AI features
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Backfill Full */}
          <button
            onClick={() => void handleBackfill(false)}
            disabled={actionLoading || !adminUnlocked || !contractCompatible}
            className="space-y-1 rounded border border-slate-800 bg-slate-900/60 p-3 text-left transition-colors hover:border-slate-700 hover:bg-slate-900 disabled:opacity-40"
          >
            <div className="font-semibold text-teal-300 flex items-center gap-1">
              <Play className="w-3 h-3" /> Backfill nến mới
            </div>
            <div className="text-[11px] text-slate-500">Resume từ nến cuối lên sàn Binance</div>
          </button>

          {/* Technical Indicators */}
          <button
            onClick={() => void handleReindexTech()}
            disabled={actionLoading || !adminUnlocked || !contractCompatible}
            className="space-y-1 rounded border border-slate-800 bg-slate-900/60 p-3 text-left transition-colors hover:border-slate-700 hover:bg-slate-900 disabled:opacity-40"
          >
            <div className="font-semibold text-slate-200 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> Re-index Indicators
            </div>
            <div className="text-[11px] text-slate-500">RSI, MACD, EMA, SMA, ATR, BB</div>
          </button>

          {/* ML Features */}
          <button
            onClick={() => void handleReindexMl()}
            disabled={actionLoading || !adminUnlocked || !contractCompatible}
            className="space-y-1 rounded border border-slate-800 bg-slate-900/60 p-3 text-left transition-colors hover:border-slate-700 hover:bg-slate-900 disabled:opacity-40"
          >
            <div className="font-semibold text-slate-200 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Rebuild ML Dataset
            </div>
            <div className="text-[11px] text-slate-500">MlFeatureStore &amp; PriceTargets</div>
          </button>

          {/* Warmup Pattern Index */}
          <button
            onClick={() => void handleWarmupPatternIndex()}
            disabled={actionLoading || !adminUnlocked || !contractCompatible}
            className="space-y-1 rounded border border-slate-800 bg-slate-900/60 p-3 text-left transition-colors hover:border-slate-700 hover:bg-slate-900 disabled:opacity-40"
          >
            <div className="font-semibold text-slate-200 flex items-center gap-1">
              <Flame className="w-3 h-3" /> Warmup Pattern Index
            </div>
            <div className="text-[11px] text-slate-500">Pre-index window vectors</div>
          </button>
        </div>
      </div>

      {/* Section 3: Diagnostic RAG & Tech Context Tester */}
      <div className="space-y-2 border-t border-slate-800 bg-slate-950/40 p-3 sm:p-4">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          Kiểm thử RAG news embedding &amp; technical context (diagnostic)
        </h4>

        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="Nhập từ khóa tìm kiếm tin tức pgvector..."
              className="h-10 flex-1 rounded border border-slate-800 bg-slate-950 px-3 text-xs text-slate-200 transition-colors focus:border-teal-500 focus:outline-none"
            />
            <button
              onClick={() => void handleTestRag()}
              className="h-10 shrink-0 rounded bg-teal-500 px-4 text-xs font-semibold text-slate-950 transition-colors hover:bg-teal-400"
            >
              Test RAG
            </button>
            <button
              onClick={() => void handleTestTechSummary()}
              className="h-10 shrink-0 rounded border border-slate-700 bg-slate-950 px-4 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-slate-200"
            >
              Test Tech Summary
            </button>
          </div>

          {ragResult && (
            <div className="max-h-36 overflow-y-auto rounded border border-slate-800 bg-slate-950 p-2.5 font-mono text-[10px] text-slate-300 whitespace-pre-wrap">
              <span className="text-teal-400 font-bold block mb-1">Kết quả RAG News Context:</span>
              {ragResult}
            </div>
          )}

          {techResult && (
            <div className="max-h-36 overflow-y-auto rounded border border-slate-800 bg-slate-950 p-2.5 font-mono text-[10px] text-slate-300 whitespace-pre-wrap">
              <span className="text-teal-400 font-bold block mb-1">Kết quả Technical Summary ({selectedSymbol}):</span>
              {techResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
