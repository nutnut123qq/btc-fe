"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  Bell,
  Newspaper,
  Settings,
  LineChart,
  Bot,
  Layers,
  TrendingUp,
  BarChart3,
  Shapes,
  ListOrdered,
} from "lucide-react";
import { MarketScreen } from "./MarketScreen";
import { NewsScreen } from "./NewsScreen";
import { AiAnalysisScreen } from "./AiAnalysisScreen";
import { AlertSettingsScreen } from "./AlertSettingsScreen";
import { AlertsDrawer } from "./AlertsDrawer";
import { DiscoveryScreen } from "./DiscoveryScreen";
import { PredictionScreen } from "./PredictionScreen";
import { BacktestScreen } from "./BacktestScreen";
import { PaperTradeScreen } from "./PaperTradeScreen";
import { BinanceTradeHistoryScreen } from "./BinanceTradeHistoryScreen";
import { ArchetypeScreen } from "./ArchetypeScreen";
import { AiChatWidget } from "./AiChatWidget";
import { ErrorBoundary } from "./ErrorBoundary";
import { getUnreadCount } from "@/lib/api";

const TABS = [
  { key: "market", label: "Thị trường", icon: LineChart },
  { key: "archetype", label: "Mẫu nến", icon: Shapes },
  { key: "news", label: "Tin tức", icon: Newspaper },
  { key: "ai", label: "AI", icon: Bot },
  { key: "rules", label: "Rules nến", icon: Layers },
  { key: "predict", label: "Dự đoán", icon: TrendingUp },
  { key: "paper", label: "Paper", icon: LineChart },
  { key: "binanceHistory", label: "Lịch sử Binance", icon: ListOrdered },
  { key: "backtest", label: "Backtest", icon: BarChart3 },
  { key: "settings", label: "Cảnh báo", icon: Settings },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const ALERT_USER_ID = "default";

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabKey>("market");
  const [visitedTabs, setVisitedTabs] = useState<Set<TabKey>>(() => new Set(["market"]));
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setVisitedTabs((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const pollUnread = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }
    try {
      const n = await getUnreadCount(ALERT_USER_ID);
      setUnread(n);
    } catch {}
  }, []);

  useEffect(() => {
    void pollUnread();
    const interval = setInterval(() => void pollUnread(), 15000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void pollUnread();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [pollUnread]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent flex items-center gap-2">
            <Activity className="text-teal-400" />
            Bitcoin AI Analyst
          </h1>
          <button
            onClick={() => setAlertsOpen(true)}
            className="relative p-2 rounded-lg border border-gray-700 bg-gray-900 hover:bg-gray-800 text-gray-300"
            aria-label="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center text-[10px] font-bold bg-rose-600 text-white rounded-full">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4">
        {visitedTabs.has("market") && (
          <div className={activeTab === "market" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Thị trường">
              <MarketScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("archetype") && (
          <div className={activeTab === "archetype" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Mẫu nến">
              <ArchetypeScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("news") && (
          <div className={activeTab === "news" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Tin tức">
              <NewsScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("ai") && (
          <div className={activeTab === "ai" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab AI">
              <AiAnalysisScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("rules") && (
          <div className={activeTab === "rules" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Rules nến">
              <DiscoveryScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("predict") && (
          <div className={activeTab === "predict" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Dự đoán">
              <PredictionScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("paper") && (
          <div className={activeTab === "paper" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Paper Trading">
              <PaperTradeScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("binanceHistory") && (
          <div className={activeTab === "binanceHistory" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Lịch sử Binance">
              <BinanceTradeHistoryScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("backtest") && (
          <div className={activeTab === "backtest" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Backtest">
              <BacktestScreen />
            </ErrorBoundary>
          </div>
        )}
        {visitedTabs.has("settings") && (
          <div className={activeTab === "settings" ? "" : "hidden"}>
            <ErrorBoundary fallbackTitle="Lỗi tải tab Cảnh báo">
              <AlertSettingsScreen />
            </ErrorBoundary>
          </div>
        )}
      </main>

      <nav className="border-t border-gray-800 bg-gray-950 sticky bottom-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-around">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => handleTabChange(t.key)}
                className={`flex flex-col items-center gap-0.5 py-2 px-4 flex-1 transition-colors ${
                  active ? "text-teal-400" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <AlertsDrawer open={alertsOpen} onClose={() => setAlertsOpen(false)} />
      <AiChatWidget />
    </div>
  );
}
