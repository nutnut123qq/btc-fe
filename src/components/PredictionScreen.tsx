"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Clock } from "lucide-react";
import { getLatestPrediction, getPredictionHistory, getAvailableModels } from "@/lib/api";
import type { PredictionResult, ModelPredictionItem, AvailableModel } from "@/lib/types";
import { WINDOW_SIZES } from "@/lib/types";

const TIMEFRAME_OPTIONS = ["15m", "30m", "1h", "4h", "1d"];
const HORIZON_OPTIONS = ["1h", "4h", "1d"];

function labelText(label: number) {
  if (label === 1) return "TĂNG";
  if (label === -1) return "GIẢM";
  return "ĐI NGANG";
}

function labelColor(label: number) {
  if (label === 1) return "text-emerald-400 bg-emerald-950/50 border-emerald-800";
  if (label === -1) return "text-rose-400 bg-rose-950/50 border-rose-800";
  return "text-amber-400 bg-amber-950/50 border-amber-800";
}

function formatTime(ms: number) {
  return new Date(ms).toLocaleString("vi-VN", { hour12: false });
}

export function PredictionScreen() {
  const [symbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState("1h");
  const [windowSize, setWindowSize] = useState(5);
  const [horizon, setHorizon] = useState("1h");
  const [modelName, setModelName] = useState("");
  const [models, setModels] = useState<AvailableModel[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<ModelPredictionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadModels = async () => {
    try {
      const data = await getAvailableModels();
      setModels(data.models ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  const runPrediction = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getLatestPrediction({
        symbol,
        timeframe,
        windowSize,
        horizon,
        modelName: modelName || undefined,
      });
      setPrediction(result);
    } catch (e: any) {
      setError(e?.message ?? "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await getPredictionHistory(symbol, timeframe, 50);
      setHistory(data.items ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    void loadModels();
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [timeframe, symbol]);

  const availableModelNames = Array.from(new Set(models.map((m) => m.model_name))).filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-400" />
          Dự đoán hướng giá ML
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              {TIMEFRAME_OPTIONS.map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Window size</label>
            <select
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              {WINDOW_SIZES.map((ws) => (
                <option key={ws} value={ws}>{ws}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Horizon</label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              {HORIZON_OPTIONS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Model</label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Auto (best)</option>
              {availableModelNames.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => void runPrediction()}
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-500 disabled:bg-gray-700 text-white font-medium rounded-lg px-4 py-2 text-sm flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Đang dự đoán..." : "Dự đoán"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-950/50 border border-rose-800 text-rose-300 rounded-lg px-3 py-2 text-sm mb-4">
            {error}
          </div>
        )}

        {prediction && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`border rounded-xl p-4 ${labelColor(prediction.prediction.label)}`}>
              <div className="text-xs text-gray-400 mb-1">Dự đoán</div>
              <div className="text-2xl font-bold flex items-center gap-2">
                {prediction.prediction.label === 1 ? <TrendingUp /> : prediction.prediction.label === -1 ? <TrendingDown /> : <Minus />}
                {labelText(prediction.prediction.label)}
              </div>
              <div className="text-sm mt-1">
                Confidence: {(prediction.prediction.confidence * 100).toFixed(1)}%
              </div>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-2">Xác suất</div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-rose-400">Giảm</span>
                    <span>{(prediction.prediction.prob_down * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500" style={{ width: `${prediction.prediction.prob_down * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-amber-400">Đi ngang</span>
                    <span>{(prediction.prediction.prob_sideways * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${prediction.prediction.prob_sideways * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-emerald-400">Tăng</span>
                    <span>{(prediction.prediction.prob_up * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${prediction.prediction.prob_up * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 text-sm">
              <div className="text-xs text-gray-400 mb-2">Thông tin</div>
              <div className="space-y-1 text-gray-300">
                <div>Model: <span className="text-teal-400">{prediction.prediction.model_version}</span></div>
                <div>Window: {formatTime(prediction.windowStartMs)} → {formatTime(prediction.windowEndMs)}</div>
                <div>Inference: {prediction.prediction.inference_ms.toFixed(1)} ms</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          Lịch sử dự đoán
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-gray-800">
              <tr>
                <th className="text-left py-2 px-2">Thời gian</th>
                <th className="text-left py-2 px-2">Window end</th>
                <th className="text-left py-2 px-2">Dự đoán</th>
                <th className="text-right py-2 px-2">P(Giảm)</th>
                <th className="text-right py-2 px-2">P(Ngang)</th>
                <th className="text-right py-2 px-2">P(Tăng)</th>
                <th className="text-left py-2 px-2">Model</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-2 px-2 text-gray-400">{new Date(item.createdAtUtc).toLocaleString("vi-VN", { hour12: false })}</td>
                  <td className="py-2 px-2">{formatTime(item.windowEndMs)}</td>
                  <td className={`py-2 px-2 font-medium ${item.predictedLabel === 1 ? "text-emerald-400" : item.predictedLabel === -1 ? "text-rose-400" : "text-amber-400"}`}>
                    {labelText(item.predictedLabel)}
                  </td>
                  <td className="py-2 px-2 text-right text-rose-400">{(item.probDown * 100).toFixed(1)}%</td>
                  <td className="py-2 px-2 text-right text-amber-400">{(item.probSideways * 100).toFixed(1)}%</td>
                  <td className="py-2 px-2 text-right text-emerald-400">{(item.probUp * 100).toFixed(1)}%</td>
                  <td className="py-2 px-2 text-gray-400">{item.modelVersion}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-500">Chưa có dự đoán nào</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
