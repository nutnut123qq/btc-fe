"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Database,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
  BarChart3,
  Search,
  Cpu,
  FileSearch,
  TrendingUp,
} from "lucide-react";
import {
  getDataAudit,
  backfillKlines,
  getPatternIndexStatus,
  rebuildPatternIndex,
  warmupPatternIndex,
  indexTechnicalIndicators,
  rebuildMlDatasetFromIndexer,
  indexVolumeStats,
  getVolumeStats,
  buildTransitionMatrix,
  getRagNewsContext,
  getTechSummary,
} from "@/lib/api";
import type {
  DataAuditResponse,
  PatternIndexStatusDto,
  BackfillStartInfo,
} from "@/lib/types";

export function DataManagementPanel() {
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [selectedTf, setSelectedTf] = useState("1h");
  const [auditData, setAuditData] = useState<DataAuditResponse | null>(null);
  const [patternStatus, setPatternStatus] = useState<PatternIndexStatusDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Diagnostic Context Testers
  const [ragQuery, setRagQuery] = useState("Bitcoin ETF inflow market regulation");
  const [ragResult, setRagResult] = useState<string>("");
  const [techResult, setTechResult] = useState<string>("");

  const loadAudit = useCallback(async () => {
    setLoading(true);
    try {
      const [auditRes, patternRes] = await Promise.allSettled([
        getDataAudit(selectedSymbol),
        getPatternIndexStatus({ symbol: selectedSymbol, timeframe: selectedTf, featureType: "all", windowSize: 10 }),
      ]);

      if (auditRes.status === "fulfilled") setAuditData(auditRes.value);
      if (patternRes.status === "fulfilled") setPatternStatus(patternRes.value);
    } catch (err) {
      console.error("Failed to load data audit", err);
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol, selectedTf]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  const handleBackfill = async (fillGaps = false) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res: BackfillStartInfo = await backfillKlines({
        symbol: selectedSymbol,
        timeframe: selectedTf === "all" ? undefined : selectedTf,
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

  const handleReindexTech = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await indexTechnicalIndicators(selectedSymbol, selectedTf);
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
      const res = await rebuildMlDatasetFromIndexer(selectedSymbol, selectedTf);
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
      const res = await warmupPatternIndex({ symbol: selectedSymbol, timeframe: selectedTf, lookbackBars: 3000 });
      setMessage({ type: "success", text: `✅ Đã warmup Pattern Vector Index cho ${selectedSymbol} (${selectedTf})` });
      await loadAudit();
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Warmup thất bại" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleIndexVolume = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await indexVolumeStats(selectedSymbol, selectedTf, 2000);
      setMessage({ type: "success", text: `✅ Đã index Volume Anomaly Stats cho ${selectedSymbol} (${selectedTf})` });
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Index volume stats thất bại" });
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

  return (
    <div className="space-y-4 bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-lg text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-100 uppercase tracking-wide">
              Quản Trị Dữ Liệu & Kiểm Toán Indexer (Data Management & Audit)
            </h3>
            <p className="text-[11px] text-gray-400">
              Kiểm tra độ đầy đủ nến, phát hiện gaps, chạy backfill và rebuild các pipeline đặc trưng AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedSymbol}
            onChange={(e) => setSelectedSymbol(e.target.value)}
            className="bg-gray-950 border border-gray-700 rounded-lg px-2.5 py-1 text-gray-200 font-bold"
          >
            <option value="BTCUSDT">BTC/USDT</option>
            <option value="ETHUSDT">ETH/USDT</option>
            <option value="SOLUSDT">SOL/USDT</option>
          </select>

          <select
            value={selectedTf}
            onChange={(e) => setSelectedTf(e.target.value)}
            className="bg-gray-950 border border-gray-700 rounded-lg px-2.5 py-1 text-gray-200"
          >
            <option value="1m">1m</option>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="1d">1d</option>
          </select>

          <button
            onClick={() => void loadAudit()}
            disabled={loading}
            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
            title="Làm mới báo cáo audit"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${
            message.type === "success"
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/60 border-rose-500/40 text-rose-300"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-200 text-[10px]">
            Đóng
          </button>
        </div>
      )}

      {/* Section 1: Data Audit Table */}
      <div className="space-y-2">
        <h4 className="font-bold text-gray-200 flex items-center gap-1.5 text-xs">
          <FileSearch className="w-3.5 h-3.5 text-teal-400" />
          Báo Cáo Kiểm Toán Nến & Độ Phủ Dữ Liệu ({selectedSymbol})
        </h4>

        {auditData ? (
          <div className="overflow-x-auto border border-gray-800 rounded-lg">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-gray-950 text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="p-2">Khung (TF)</th>
                  <th className="p-2 text-right">Tổng số nến</th>
                  <th className="p-2 text-right">Số khoảng trống (Gaps)</th>
                  <th className="p-2 text-right">Độ phủ (%)</th>
                  <th className="p-2 text-right">Gap lớn nhất</th>
                  <th className="p-2 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {auditData.timeframes?.map((tf) => (
                  <tr key={tf.timeframe} className="hover:bg-gray-800/30">
                    <td className="p-2 font-bold text-gray-200">{tf.timeframe}</td>
                    <td className="p-2 text-right text-gray-300">{tf.totalKlines?.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <span className={tf.gapsCount > 0 ? "text-amber-400 font-bold" : "text-emerald-400"}>
                        {tf.gapsCount}
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <span
                        className={
                          tf.dataCoveragePct >= 99
                            ? "text-emerald-400 font-bold"
                            : tf.dataCoveragePct >= 95
                            ? "text-amber-400"
                            : "text-rose-400"
                        }
                      >
                        {tf.dataCoveragePct?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-2 text-right text-gray-400">
                      {tf.largestGapMs > 0 ? `${(tf.largestGapMs / 3600000).toFixed(1)}h` : "--"}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        onClick={() => {
                          setSelectedTf(tf.timeframe);
                          void handleBackfill(true);
                        }}
                        disabled={actionLoading}
                        className="px-2 py-0.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 rounded text-[10px] font-semibold transition-colors"
                      >
                        Lấp gaps
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-gray-950/40 rounded-lg text-center text-gray-500">
            Chưa có báo cáo audit. Bấm làm mới để tải.
          </div>
        )}
      </div>

      {/* Section 2: Indexers & Rebuild Pipeline Controls */}
      <div className="space-y-2 bg-gray-950 p-3 rounded-lg border border-gray-800">
        <h4 className="font-bold text-gray-200 flex items-center gap-1.5 text-xs">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          Điều Phối Pipeline Indexing & AI Features
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Backfill Full */}
          <button
            onClick={() => void handleBackfill(false)}
            disabled={actionLoading}
            className="p-2.5 bg-gray-900 hover:bg-gray-850 border border-gray-800 rounded-lg text-left transition-colors space-y-1"
          >
            <div className="font-bold text-teal-300 flex items-center gap-1">
              <Play className="w-3 h-3" /> Backfill Nến Mới
            </div>
            <div className="text-[10px] text-gray-500">Resume từ nến cuối lên sàn Binance</div>
          </button>

          {/* Technical Indicators */}
          <button
            onClick={() => void handleReindexTech()}
            disabled={actionLoading}
            className="p-2.5 bg-gray-900 hover:bg-gray-850 border border-gray-800 rounded-lg text-left transition-colors space-y-1"
          >
            <div className="font-bold text-indigo-300 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> Re-index Indicators
            </div>
            <div className="text-[10px] text-gray-500">RSI, MACD, EMA, SMA, ATR, BB</div>
          </button>

          {/* ML Features */}
          <button
            onClick={() => void handleReindexMl()}
            disabled={actionLoading}
            className="p-2.5 bg-gray-900 hover:bg-gray-850 border border-gray-800 rounded-lg text-left transition-colors space-y-1"
          >
            <div className="font-bold text-purple-300 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Rebuild ML Dataset
            </div>
            <div className="text-[10px] text-gray-500">MlFeatureStore & PriceTargets</div>
          </button>

          {/* Warmup Pattern Index */}
          <button
            onClick={() => void handleWarmupPatternIndex()}
            disabled={actionLoading}
            className="p-2.5 bg-gray-900 hover:bg-gray-850 border border-gray-800 rounded-lg text-left transition-colors space-y-1"
          >
            <div className="font-bold text-amber-300 flex items-center gap-1">
              <Flame className="w-3 h-3" /> Warmup Pattern Index
            </div>
            <div className="text-[10px] text-gray-500">Pre-index window vectors</div>
          </button>
        </div>
      </div>

      {/* Section 3: Diagnostic RAG & Tech Context Tester */}
      <div className="space-y-2 bg-gray-950 p-3 rounded-lg border border-gray-800">
        <h4 className="font-bold text-gray-200 flex items-center gap-1.5 text-xs">
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          Kiểm Thử RAG News Embedding & Technical Context (Diagnostic Tools)
        </h4>

        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={ragQuery}
              onChange={(e) => setRagQuery(e.target.value)}
              placeholder="Nhập từ khóa tìm kiếm tin tức pgvector..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-teal-500"
            />
            <button
              onClick={() => void handleTestRag()}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors"
            >
              Test RAG
            </button>
            <button
              onClick={() => void handleTestTechSummary()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
            >
              Test Tech Summary
            </button>
          </div>

          {ragResult && (
            <div className="p-2.5 bg-gray-900 rounded border border-gray-800 max-h-36 overflow-y-auto font-mono text-[10px] text-gray-300 whitespace-pre-wrap">
              <span className="text-cyan-400 font-bold block mb-1">Kết quả RAG News Context:</span>
              {ragResult}
            </div>
          )}

          {techResult && (
            <div className="p-2.5 bg-gray-900 rounded border border-gray-800 max-h-36 overflow-y-auto font-mono text-[10px] text-gray-300 whitespace-pre-wrap">
              <span className="text-indigo-400 font-bold block mb-1">Kết quả Technical Summary ({selectedSymbol}):</span>
              {techResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
