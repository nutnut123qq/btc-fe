"use client";

import { useState } from "react";
import { BinanceTradingScreen } from "./BinanceTradingScreen";
import { ChartPanel } from "./ChartPanel";
import { SequenceAnalysisPanel } from "./SequenceAnalysisPanel";
import { RegimeBadge } from "./RegimeBadge";
import { SentimentBadge } from "./SentimentBadge";
import { ConfluenceWidget } from "./ConfluenceWidget";
import { VolumeProfileWidget } from "./VolumeProfileWidget";
import { SmartMoneyWidget } from "./SmartMoneyWidget";
import { EnsembleDashboardWidget } from "./EnsembleDashboardWidget";
import { LiquidationHeatmapWidget } from "./LiquidationHeatmapWidget";
import { ErrorBoundary } from "./ErrorBoundary";
import { ChevronDown, ChevronUp, BrainCircuit, LayoutGrid, Terminal } from "lucide-react";

export function MarketScreen() {
  const [viewMode, setViewMode] = useState<"binance" | "classic">("binance");
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTCUSDT");
  const [showEnsemble, setShowEnsemble] = useState(false);

  const symbolOptions = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

  return (
    <div className="space-y-3">
      {/* View Mode Switcher Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">Chế độ xem:</span>
          <div className="inline-flex rounded-lg bg-gray-900 p-0.5 border border-gray-800 text-xs">
            <button
              onClick={() => setViewMode("binance")}
              className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "binance"
                  ? "bg-teal-500 text-gray-950 shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Sàn Binance Pro
            </button>
            <button
              onClick={() => setViewMode("classic")}
              className={`px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "classic"
                  ? "bg-teal-500 text-gray-950 shadow-sm"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Phân tích nâng cao
            </button>
          </div>
        </div>

        <span className="text-[11px] text-gray-500 hidden sm:inline">
          {viewMode === "binance" ? "Dữ liệu khớp lệnh & nến realtime đa mã" : `${selectedSymbol.replace("USDT", "/USDT")} Deep Analysis & Pattern Index`}
        </span>
      </div>

      {viewMode === "binance" ? (
        <ErrorBoundary fallbackTitle="Lỗi tải giao diện Binance Pro">
          <BinanceTradingScreen />
        </ErrorBoundary>
      ) : (
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gray-900/60 p-3 rounded-xl border border-gray-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400">Chọn coin:</span>
                <div className="inline-flex gap-1 bg-gray-950 p-1 rounded-lg border border-gray-800">
                  {symbolOptions.map((sym) => (
                    <button
                      key={sym}
                      onClick={() => setSelectedSymbol(sym)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                        selectedSymbol === sym
                          ? "bg-teal-500 text-gray-950 shadow"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      {sym.replace("USDT", "/USDT")}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Chart module, indicator pipeline, SMC & VPVR cho {selectedSymbol.replace("USDT", "/USDT")}.</p>
            </div>
            <div className="w-full sm:w-[320px] space-y-2">
              <ErrorBoundary fallbackTitle="Lỗi tải Regime">
                <RegimeBadge symbol={selectedSymbol} timeframe="1h" />
              </ErrorBoundary>
              <ErrorBoundary fallbackTitle="Lỗi tải Sentiment">
                <SentimentBadge symbol={selectedSymbol} compact={true} />
              </ErrorBoundary>
            </div>
          </div>

          <ErrorBoundary fallbackTitle="Lỗi tải Confluence Widget">
            <ConfluenceWidget symbol={selectedSymbol} />
          </ErrorBoundary>

          {/* Master AI Ensemble - Expandable */}
          <div className="bg-gray-800 border border-indigo-500/30 rounded-xl overflow-hidden shadow-lg">
            <button
              onClick={() => setShowEnsemble(!showEnsemble)}
              className="w-full flex items-center justify-between p-4 bg-gray-800/80 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-100 flex items-center gap-2">
                    Master AI Ensemble Predictor ({selectedSymbol.replace("USDT", "/USDT")})
                    <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full font-black tracking-widest">WAVE 5</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Aggregated voting from all intelligence layers</p>
                </div>
              </div>
              <div className="text-gray-400">
                {showEnsemble ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </button>
            {showEnsemble && (
              <div className="p-4 border-t border-gray-700/50 bg-gray-900/50">
                <ErrorBoundary fallbackTitle="Lỗi tải Ensemble Predictor">
                  <EnsembleDashboardWidget symbol={selectedSymbol} timeframe="1h" />
                </ErrorBoundary>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ErrorBoundary fallbackTitle="Lỗi tải Volume Profile">
              <VolumeProfileWidget symbol={selectedSymbol} timeframe="1h" />
            </ErrorBoundary>
            <ErrorBoundary fallbackTitle="Lỗi tải Smart Money Structure">
              <SmartMoneyWidget symbol={selectedSymbol} timeframe="1h" />
            </ErrorBoundary>
          </div>

          <ErrorBoundary fallbackTitle="Lỗi tải Bản đồ Thanh lý">
            <LiquidationHeatmapWidget symbol={selectedSymbol} timeframe="1h" onSymbolChange={(s) => setSelectedSymbol(s)} />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Lỗi tải biểu đồ kỹ thuật">
            <ChartPanel symbol={selectedSymbol} />
          </ErrorBoundary>

          <ErrorBoundary fallbackTitle="Lỗi tải Sequence Analysis">
            <SequenceAnalysisPanel symbol={selectedSymbol} />
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}

