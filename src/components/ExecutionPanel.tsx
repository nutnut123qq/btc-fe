"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Zap,
  Radio,
  CheckCircle2,
  XCircle,
  Activity,
  Trash2,
} from "lucide-react";
import {
  getExecutionAccount,
  placeMarketOrder,
  placeStopLossOrder,
  placeTakeProfitOrder,
  cancelAllExecutionOrders,
  getExecutionStreamStatus,
  reconnectExecutionStream,
  getExecutionBalanceSnapshots,
} from "@/lib/api";
import type {
  BinanceAccountBalanceResult,
  StreamStatusDto,
  WalletBalanceSnapshotDto,
} from "@/lib/types";

interface ExecutionPanelProps {
  symbol?: string;
  currentPrice?: number;
  onOrderSuccess?: () => void;
}

export function ExecutionPanel({
  symbol = "BTCUSDT",
  currentPrice,
  onOrderSuccess,
}: ExecutionPanelProps) {
  const [account, setAccount] = useState<BinanceAccountBalanceResult | null>(null);
  const [streamStatus, setStreamStatus] = useState<StreamStatusDto | null>(null);
  const [snapshots, setSnapshots] = useState<WalletBalanceSnapshotDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Order Form State
  const [orderType, setOrderType] = useState<"market" | "stop_loss" | "take_profit">("market");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [quantity, setQuantity] = useState<string>("0.005");
  const [stopPrice, setStopPrice] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, streamRes, snapRes] = await Promise.allSettled([
        getExecutionAccount(),
        getExecutionStreamStatus(),
        getExecutionBalanceSnapshots("USDT", 10),
      ]);

      if (accRes.status === "fulfilled") setAccount(accRes.value);
      if (streamRes.status === "fulfilled") setStreamStatus(streamRes.value);
      if (snapRes.status === "fulfilled") setSnapshots(snapRes.value);
    } catch (err) {
      console.error("Failed to load execution account", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadData();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Set default stop price when current price changes
  useEffect(() => {
    if (currentPrice && currentPrice > 0 && !stopPrice) {
      if (orderType === "take_profit") {
        setStopPrice(orderSide === "BUY" ? (currentPrice * 1.02).toFixed(2) : (currentPrice * 0.98).toFixed(2));
      } else if (orderType === "stop_loss") {
        setStopPrice(orderSide === "BUY" ? (currentPrice * 0.98).toFixed(2) : (currentPrice * 1.02).toFixed(2));
      }
    }
  }, [currentPrice, orderType, orderSide, stopPrice]);

  const handlePlaceOrder = async () => {
    const qty = Number.parseFloat(quantity);
    if (!qty || qty <= 0) {
      setMessage({ type: "error", text: "Khối lượng lệnh phải lớn hơn 0" });
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      let res;
      if (orderType === "market") {
        res = await placeMarketOrder({ symbol, side: orderSide, quantity: qty });
      } else if (orderType === "stop_loss") {
        const sp = Number.parseFloat(stopPrice);
        if (!sp || sp <= 0) {
          setMessage({ type: "error", text: "Giá cắt lỗ (Stop Price) không hợp lệ" });
          setActionLoading(false);
          return;
        }
        res = await placeStopLossOrder({ symbol, side: orderSide, quantity: qty, stopPrice: sp });
      } else {
        const tp = Number.parseFloat(stopPrice);
        if (!tp || tp <= 0) {
          setMessage({ type: "error", text: "Giá chốt lời (Take Profit Price) không hợp lệ" });
          setActionLoading(false);
          return;
        }
        res = await placeTakeProfitOrder({ symbol, side: orderSide, quantity: qty, stopPrice: tp });
      }

      if (res && res.success) {
        setMessage({
          type: "success",
          text: `✅ Đặt lệnh ${orderSide} ${orderType.toUpperCase()} thành công! OrderID: #${res.orderId || "OK"}`,
        });
        await loadData();
        if (onOrderSuccess) onOrderSuccess();
      } else {
        setMessage({
          type: "error",
          text: `❌ Lỗi đặt lệnh: ${res?.message || "Không xác định"}`,
        });
      }
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Đặt lệnh thất bại",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAll = async () => {
    if (!confirm(`Bạn có chắc muốn hủy TẤT CẢ lệnh chờ của mã ${symbol} trên Testnet?`)) return;

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await cancelAllExecutionOrders(symbol);
      if (res && res.success) {
        setMessage({ type: "success", text: `✅ Đã hủy tất cả lệnh chờ cho ${symbol}` });
        await loadData();
      } else {
        setMessage({ type: "error", text: `❌ Lỗi hủy lệnh: ${res?.message || "Không xác định"}` });
      }
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Hủy lệnh thất bại",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReconnectStream = async () => {
    setActionLoading(true);
    try {
      const res = await reconnectExecutionStream();
      setStreamStatus(res.status);
      setMessage({ type: "success", text: "✅ Đã kích hoạt kết nối lại User Data Stream" });
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Lỗi kết nối lại Stream",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-3 bg-gray-900 border border-gray-800 rounded-xl p-3.5 shadow-lg text-xs">
      {/* Header & Stream Status */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-gray-100 uppercase tracking-wide">
            Binance Futures Testnet Execution
          </h3>
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-1.5 py-0.2 rounded">
            Live Orders
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Stream Connection Pill */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
              streamStatus?.connected
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                streamStatus?.connected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
              }`}
            />
            <span>{streamStatus?.connected ? "Stream OK" : "Stream Disconnected"}</span>
          </div>

          <button
            onClick={() => void handleReconnectStream()}
            disabled={actionLoading}
            className="p-1 text-gray-400 hover:text-gray-200 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
            title="Kết nối lại User Data Stream"
          >
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          <button
            onClick={() => void loadData()}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-200 bg-gray-800 rounded hover:bg-gray-700 transition-colors"
            title="Làm mới số dư"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-teal-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs ${
            message.type === "success"
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/60 border-rose-500/40 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-200 text-[10px]">
            Đóng
          </button>
        </div>
      )}

      {/* Account Balances Grid */}
      {account && (
        <div className="grid grid-cols-3 gap-2 bg-gray-950 p-2.5 rounded-lg border border-gray-800/80">
          <div>
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Số dư Ví (USDT)</div>
            <div className="font-bold text-gray-100 text-sm">
              ${account.totalWalletBalance?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Khả dụng (Available)</div>
            <div className="font-bold text-teal-400 text-sm">
              ${account.availableBalance?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase font-semibold">PnL Chưa thực hiện</div>
            <div
              className={`font-bold text-sm ${
                account.totalUnrealizedProfit >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {account.totalUnrealizedProfit >= 0 ? "+" : ""}
              ${account.totalUnrealizedProfit?.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Open Positions List */}
      {account && account.positions && account.positions.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Vị thế Testnet đang mở ({account.positions.length}):
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {account.positions.map((pos, idx) => {
              const isLong = pos.positionAmount > 0;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-gray-950/70 p-2 rounded border border-gray-800 font-mono text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                        isLong ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {isLong ? "LONG" : "SHORT"} {pos.leverage}x
                    </span>
                    <span className="font-bold text-gray-200">{pos.symbol}</span>
                    <span className="text-gray-400">Qty: {Math.abs(pos.positionAmount)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-300">Vào: ${pos.entryPrice?.toFixed(2)}</span>
                    <span className={pos.unrealizedProfit >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {pos.unrealizedProfit >= 0 ? "+" : ""}${pos.unrealizedProfit?.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Order Placement Form */}
      <div className="bg-gray-950 p-3 rounded-lg border border-gray-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-200">Đặt Lệnh Testnet ({symbol})</span>
          <div className="inline-flex rounded-lg bg-gray-900 p-0.5 border border-gray-800">
            <button
              onClick={() => setOrderType("market")}
              className={`px-2 py-0.5 rounded font-bold text-[10px] transition-colors ${
                orderType === "market" ? "bg-teal-500 text-gray-950 shadow" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType("stop_loss")}
              className={`px-2 py-0.5 rounded font-bold text-[10px] transition-colors ${
                orderType === "stop_loss" ? "bg-rose-500 text-white shadow" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Stop Loss
            </button>
            <button
              onClick={() => setOrderType("take_profit")}
              className={`px-2 py-0.5 rounded font-bold text-[10px] transition-colors ${
                orderType === "take_profit" ? "bg-emerald-500 text-gray-950 shadow" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Take Profit
            </button>
          </div>
        </div>

        {/* Side Selector (BUY / SELL) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setOrderSide("BUY")}
            className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 border transition-all ${
              orderSide === "BUY"
                ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow"
                : "bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-850"
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            MUA / LONG
          </button>
          <button
            onClick={() => setOrderSide("SELL")}
            className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 border transition-all ${
              orderSide === "SELL"
                ? "bg-rose-500/25 text-rose-300 border-rose-500/50 shadow"
                : "bg-gray-900 text-gray-400 border-gray-800 hover:bg-gray-850"
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            BÁN / SHORT
          </button>
        </div>

        {/* Quantity & Price Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-400 mb-1">
              Khối lượng ({symbol.replace("USDT", "")})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.005"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          {orderType !== "market" && (
            <div>
              <label className="block text-[10px] text-gray-400 mb-1">
                {orderType === "stop_loss" ? "Giá Cắt Lỗ (Stop Price $)" : "Giá Chốt Lời (TP Price $)"}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                placeholder={currentPrice ? String(currentPrice) : "95000"}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-gray-200 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
          )}
        </div>

        {/* Submit & Cancel All Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => void handlePlaceOrder()}
            disabled={actionLoading}
            className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 ${
              orderSide === "BUY"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            {actionLoading
              ? "Đang gửi lệnh..."
              : `Gửi Lệnh ${orderSide} ${orderType.replace("_", " ").toUpperCase()}`}
          </button>

          <button
            onClick={() => void handleCancelAll()}
            disabled={actionLoading}
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-rose-300 border border-gray-700 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
            title="Hủy toàn bộ lệnh mở của mã này"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hủy hết
          </button>
        </div>
      </div>

      {/* Balance Snapshots Collapsible */}
      {snapshots.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-gray-500 font-semibold uppercase">
            Lịch sử cập nhật số dư gần nhất ({snapshots.length})
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {snapshots.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between bg-gray-950/40 px-2 py-1 rounded text-[10px] text-gray-400 font-mono"
              >
                <span>
                  {s.eventReasonType || "BALANCE_UPDATE"} ({s.asset})
                </span>
                <span className="font-bold text-gray-200">${s.walletBalance?.toFixed(2)}</span>
                <span className="text-gray-500">
                  {new Date(s.timestamp).toLocaleTimeString("vi-VN")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
