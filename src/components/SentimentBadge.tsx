"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Gauge,
  Flame,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp,
  Newspaper,
  Coins,
  Percent,
} from "lucide-react";
import { getCurrentSentiment, refreshSentiment } from "@/lib/api";
import type { SentimentSnapshotDto } from "@/lib/types";

interface SentimentBadgeProps {
  symbol?: string;
  compact?: boolean;
}

export function SentimentBadge({ symbol = "BTCUSDT", compact = false }: SentimentBadgeProps) {
  const [sentiment, setSentiment] = useState<SentimentSnapshotDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const loadSentiment = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCurrentSentiment(symbol);
      setSentiment(data);
    } catch (err) {
      console.error("Failed to load sentiment", err);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    void loadSentiment();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadSentiment();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [loadSentiment]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await refreshSentiment(symbol);
      setSentiment(data);
    } catch (err) {
      console.error("Failed to refresh sentiment", err);
    } finally {
      setRefreshing(false);
    }
  };

  const getSentimentDetails = (score: number, label?: string) => {
    if (score <= 25 || label === "ExtremeFear") {
      return {
        label: "Cực kỳ sợ hãi",
        color: "text-rose-400 bg-rose-500/15 border-rose-500/30",
        barColor: "bg-rose-500",
        icon: TrendingDown,
      };
    }
    if (score <= 45 || label === "Fear") {
      return {
        label: "Sợ hãi",
        color: "text-amber-400 bg-amber-500/15 border-amber-500/30",
        barColor: "bg-amber-500",
        icon: TrendingDown,
      };
    }
    if (score <= 55 || label === "Neutral") {
      return {
        label: "Trung lập",
        color: "text-blue-400 bg-blue-500/15 border-blue-500/30",
        barColor: "bg-blue-500",
        icon: Gauge,
      };
    }
    if (score <= 75 || label === "Greed") {
      return {
        label: "Hưng phấn",
        color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
        barColor: "bg-emerald-500",
        icon: TrendingUp,
      };
    }
    return {
      label: "Cực kỳ hưng phấn",
      color: "text-teal-300 bg-teal-500/20 border-teal-500/40",
      barColor: "bg-teal-400",
      icon: Flame,
    };
  };

  const score = sentiment?.aggregatedSentiment ?? 50;
  const cfg = getSentimentDetails(score, sentiment?.sentimentLabel);
  const Icon = cfg.icon;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1 text-xs shadow-sm">
        <Gauge className="w-3.5 h-3.5 text-teal-400" />
        <span className="text-gray-400 text-[11px]">Tâm lý:</span>
        <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] border ${cfg.color}`}>
          {score.toFixed(0)} - {cfg.label}
        </span>
        <button
          onClick={() => void handleRefresh()}
          disabled={refreshing}
          className="text-gray-500 hover:text-gray-300 ml-1 transition-colors disabled:opacity-50"
          title="Làm mới điểm tâm lý"
        >
          <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin text-teal-400" : ""}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-3.5 shadow-lg space-y-2.5 text-xs">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-100 uppercase tracking-wide flex items-center gap-1.5">
              Chỉ Số Tâm Lý Vĩ Mô (Macro Sentiment)
            </h3>
            <p className="text-[10px] text-gray-400">
              Tổng hợp Fear & Greed, Funding Rate, L/S Ratio & Tin tức NLP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors"
          >
            {showDetails ? "Thu gọn" : "Chi tiết"}
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
            title="Tính toán lại Snapshot Tâm lý"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-teal-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Meter Gauge */}
      <div className="bg-gray-950 p-3 rounded-lg border border-gray-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-teal-400" />
            <div>
              <span className="text-xl font-extrabold text-white font-mono">{score.toFixed(1)}</span>
              <span className="text-gray-500 text-[10px] ml-1">/ 100</span>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-md font-bold text-xs border uppercase tracking-wider ${cfg.color}`}>
            {cfg.label}
          </span>
        </div>

        {/* Gradient Progress Bar */}
        <div className="space-y-1">
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 rounded-full ${cfg.barColor}`}
              style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-gray-500 font-mono">
            <span>0 (Cực sợ)</span>
            <span>25</span>
            <span>50 (Trung lập)</span>
            <span>75</span>
            <span>100 (Cực tham)</span>
          </div>
        </div>
      </div>

      {/* Breakdown Details Grid */}
      {showDetails && sentiment && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 animate-in fade-in duration-200">
          {/* 1. Fear & Greed */}
          <div className="bg-gray-950 p-2 rounded-lg border border-gray-800">
            <div className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
              <Coins className="w-3 h-3 text-amber-400" /> Fear & Greed (30%)
            </div>
            <div className="font-bold text-gray-200 text-sm mt-0.5">
              {sentiment.fearGreedScore?.toFixed(0) ?? "--"}
            </div>
          </div>

          {/* 2. News NLP */}
          <div className="bg-gray-950 p-2 rounded-lg border border-gray-800">
            <div className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
              <Newspaper className="w-3 h-3 text-cyan-400" /> News NLP (40%)
            </div>
            <div className="font-bold text-gray-200 text-sm mt-0.5">
              {sentiment.newsSentimentScore ? `${(sentiment.newsSentimentScore * 100).toFixed(0)}` : "--"}
            </div>
          </div>

          {/* 3. Funding Z-Score */}
          <div className="bg-gray-950 p-2 rounded-lg border border-gray-800">
            <div className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
              <Percent className="w-3 h-3 text-purple-400" /> Funding Z-Score
            </div>
            <div className="font-bold text-gray-200 text-sm mt-0.5">
              {sentiment.fundingRateZScore?.toFixed(2) ?? "--"}
            </div>
          </div>

          {/* 4. Long/Short Ratio */}
          <div className="bg-gray-950 p-2 rounded-lg border border-gray-800">
            <div className="text-[10px] text-gray-500 uppercase flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> L/S Ratio
            </div>
            <div className="font-bold text-gray-200 text-sm mt-0.5">
              {sentiment.longShortRatio?.toFixed(2) ?? "--"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
