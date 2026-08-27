/**
 * Binance Live WebSocket Streaming Client (High-Concurrency Anti-Lag Engine)
 * =========================================================================
 * - Singleton multiplexed WebSocket connection to Binance Public Streams:
 *   wss://stream.binance.com:9443/stream?streams=...
 * - Frame-Throttling Engine (requestAnimationFrame + 60ms-80ms batch buffer)
 *   to eliminate UI freezes and 60+ re-renders/sec under high volume.
 * - Auto-reconnect with exponential backoff & resilience.
 */

export interface BinanceLiveTicker {
  symbol: string;
  lastPrice: number;
  priceChangePercent: number;
  priceChange: number;
  high24h: number;
  low24h: number;
  volume: number;
  quoteVolume: number;
  timestampMs: number;
}

export interface BinanceLiveTrade {
  symbol: string;
  price: number;
  quantity: number;
  isBuyerMaker: boolean;
  timeMs: number;
}

type TickerCallback = (ticker: BinanceLiveTicker) => void;
type TradeCallback = (trade: BinanceLiveTrade) => void;

class BinanceWebSocketManager {
  private ws: WebSocket | null = null;
  private tickerSubscribers = new Map<string, Set<TickerCallback>>();
  private tradeSubscribers = new Map<string, Set<TradeCallback>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private isConnecting = false;
  private readonly maxReconnectDelay = 15000;

  // Active symbol list
  private activeSymbols = new Set<string>(["BTCUSDT", "ETHUSDT", "SOLUSDT"]);

  // Frame-throttling batch buffers
  private pendingTickers = new Map<string, BinanceLiveTicker>();
  private pendingTrades = new Map<string, BinanceLiveTrade[]>();
  private frameScheduled = false;
  private lastFlushTime = 0;
  private readonly throttleIntervalMs = 60; // Max ~16 FPS to 60 FPS capped for UI rendering

  public subscribeTicker(symbol: string, cb: TickerCallback): () => void {
    const sym = symbol.toUpperCase();
    this.activeSymbols.add(sym);
    if (!this.tickerSubscribers.has(sym)) {
      this.tickerSubscribers.set(sym, new Set());
    }
    this.tickerSubscribers.get(sym)!.add(cb);

    this.ensureConnection();

    return () => {
      const set = this.tickerSubscribers.get(sym);
      if (set) {
        set.delete(cb);
        if (set.size === 0) {
          this.tickerSubscribers.delete(sym);
        }
      }
    };
  }

  public subscribeTrade(symbol: string, cb: TradeCallback): () => void {
    const sym = symbol.toUpperCase();
    this.activeSymbols.add(sym);
    if (!this.tradeSubscribers.has(sym)) {
      this.tradeSubscribers.set(sym, new Set());
    }
    this.tradeSubscribers.get(sym)!.add(cb);

    this.ensureConnection();

    return () => {
      const set = this.tradeSubscribers.get(sym);
      if (set) {
        set.delete(cb);
        if (set.size === 0) {
          this.tradeSubscribers.delete(sym);
        }
      }
    };
  }

  private getCombinedStreams(): string[] {
    const streams: string[] = [];
    for (const sym of this.activeSymbols) {
      const lower = sym.toLowerCase();
      streams.push(`${lower}@ticker`);
      streams.push(`${lower}@trade`);
    }
    return streams;
  }

  private ensureConnection() {
    if (typeof window === "undefined") return; // SSR safe
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    if (this.isConnecting) return;

    this.connect();
  }

  private connect() {
    if (typeof window === "undefined") return;
    this.isConnecting = true;

    try {
      const streams = this.getCombinedStreams();
      const streamUrl = `wss://stream.binance.com:9443/stream?streams=${streams.join("/")}`;

      this.ws = new WebSocket(streamUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const stream = payload.stream as string | undefined;
          const data = payload.data;

          if (!stream || !data) return;

          if (stream.endsWith("@ticker")) {
            const sym = (data.s || "").toUpperCase();
            const ticker: BinanceLiveTicker = {
              symbol: sym,
              lastPrice: parseFloat(data.c || "0"),
              priceChangePercent: parseFloat(data.P || "0"),
              priceChange: parseFloat(data.p || "0"),
              high24h: parseFloat(data.h || "0"),
              low24h: parseFloat(data.l || "0"),
              volume: parseFloat(data.v || "0"),
              quoteVolume: parseFloat(data.q || "0"),
              timestampMs: Number(data.E || Date.now()),
            };

            // Buffer latest ticker state
            this.pendingTickers.set(sym, ticker);
            this.scheduleFrameFlush();
          } else if (stream.endsWith("@trade")) {
            const sym = (data.s || "").toUpperCase();
            const trade: BinanceLiveTrade = {
              symbol: sym,
              price: parseFloat(data.p || "0"),
              quantity: parseFloat(data.q || "0"),
              isBuyerMaker: Boolean(data.m),
              timeMs: Number(data.T || Date.now()),
            };

            // Append trade to batch
            if (!this.pendingTrades.has(sym)) {
              this.pendingTrades.set(sym, []);
            }
            this.pendingTrades.get(sym)!.push(trade);
            this.scheduleFrameFlush();
          }
        } catch {
          // Ignore malformed WS frames
        }
      };

      this.ws.onerror = () => {
        // WebSocket will trigger onclose on error
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.ws = null;
        this.scheduleReconnect();
      };
    } catch {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Schedules a frame-throttled dispatch to subscribers.
   */
  private scheduleFrameFlush() {
    if (this.frameScheduled) return;

    const now = Date.now();
    const elapsed = now - this.lastFlushTime;

    if (elapsed >= this.throttleIntervalMs) {
      this.frameScheduled = true;
      if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
        window.requestAnimationFrame(() => this.flushPendingData());
      } else {
        setTimeout(() => this.flushPendingData(), 0);
      }
    } else {
      this.frameScheduled = true;
      setTimeout(() => {
        if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
          window.requestAnimationFrame(() => this.flushPendingData());
        } else {
          this.flushPendingData();
        }
      }, this.throttleIntervalMs - elapsed);
    }
  }

  /**
   * Flushes all accumulated tickers and trades to subscriber callbacks in a single animation frame.
   */
  private flushPendingData() {
    this.frameScheduled = false;
    this.lastFlushTime = Date.now();

    // 1. Dispatch latest Tickers
    if (this.pendingTickers.size > 0) {
      for (const [sym, ticker] of this.pendingTickers) {
        const subscribers = this.tickerSubscribers.get(sym);
        if (subscribers && subscribers.size > 0) {
          subscribers.forEach((cb) => {
            try {
              cb(ticker);
            } catch (err) {
              console.error("[BinanceWS] Error in ticker callback:", err);
            }
          });
        }
      }
      this.pendingTickers.clear();
    }

    // 2. Dispatch Trades (batch latest items)
    if (this.pendingTrades.size > 0) {
      for (const [sym, trades] of this.pendingTrades) {
        const subscribers = this.tradeSubscribers.get(sym);
        if (subscribers && subscribers.size > 0) {
          // Send trades to each subscriber
          for (const trade of trades) {
            subscribers.forEach((cb) => {
              try {
                cb(trade);
              } catch (err) {
                console.error("[BinanceWS] Error in trade callback:", err);
              }
            });
          }
        }
      }
      this.pendingTrades.clear();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

// Global singleton instance
const binanceWsManager = new BinanceWebSocketManager();

export function subscribeBinanceTicker(symbol: string, callback: (ticker: BinanceLiveTicker) => void): () => void {
  return binanceWsManager.subscribeTicker(symbol, callback);
}

export function subscribeBinanceTickers(
  symbols: string[],
  callback: (ticker: BinanceLiveTicker) => void
): () => void {
  const unsubscribes = symbols.map((sym) => binanceWsManager.subscribeTicker(sym, callback));
  return () => {
    unsubscribes.forEach((unsub) => unsub());
  };
}

export function subscribeBinanceTrade(symbol: string, callback: (trade: BinanceLiveTrade) => void): () => void {
  return binanceWsManager.subscribeTrade(symbol, callback);
}
