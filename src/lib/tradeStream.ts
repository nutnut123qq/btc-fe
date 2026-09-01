import * as signalR from "@microsoft/signalr";

export interface LiveTradeExecutedEvent {
  symbol: string;
  side: string;
  status: string;
  executionType: string;
  orderType: string;
  entryPrice: number;
  exitPrice?: number | null;
  executedQty: number;
  realizedPnL?: number | null;
  netReturn?: number | null;
  exitReason?: string | null;
  orderId?: number;
  clientOrderId?: string;
  isClosed: boolean;
  timestamp: number;
}

export interface LiveBalanceUpdatedEvent {
  eventReason: string;
  balances: Array<{
    asset: string;
    walletBalance: number;
    crossWalletBalance: number;
    balanceChange: number;
  }>;
  positions: Array<{
    symbol: string;
    positionAmount: number;
    entryPrice: number;
    unrealizedPnL: number;
  }>;
  totalUnrealizedProfit: number;
  timestamp: number;
}

type TradeExecutedHandler = (event: LiveTradeExecutedEvent) => void;
type BalanceUpdatedHandler = (event: LiveBalanceUpdatedEvent) => void;
type StatusChangeHandler = (connected: boolean) => void;

let connection: signalR.HubConnection | null = null;
const tradeHandlers = new Set<TradeExecutedHandler>();
const balanceHandlers = new Set<BalanceUpdatedHandler>();
const statusHandlers = new Set<StatusChangeHandler>();

export function getSignalRHubUrl(): string {
  return "/hubs/trade-notifications";
}

export function subscribeTradeStream(
  onTrade: TradeExecutedHandler,
  onBalance?: BalanceUpdatedHandler,
  onStatus?: StatusChangeHandler
): () => void {
  tradeHandlers.add(onTrade);
  if (onBalance) balanceHandlers.add(onBalance);
  if (onStatus) {
    statusHandlers.add(onStatus);
    onStatus(connection?.state === signalR.HubConnectionState.Connected);
  }

  ensureConnection();

  return () => {
    tradeHandlers.delete(onTrade);
    if (onBalance) balanceHandlers.delete(onBalance);
    if (onStatus) statusHandlers.delete(onStatus);

    if (tradeHandlers.size === 0 && balanceHandlers.size === 0 && statusHandlers.size === 0) {
      // If no more subscribers, keep connection or cleanup if desired
    }
  };
}

async function ensureConnection() {
  if (connection && connection.state !== signalR.HubConnectionState.Disconnected) {
    return;
  }

  const hubUrl = getSignalRHubUrl();

  connection = new signalR.HubConnectionBuilder()
    .withUrl(hubUrl, {
      skipNegotiation: false,
      transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  connection.on("OnTradeExecuted", (data: LiveTradeExecutedEvent) => {
    tradeHandlers.forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        console.error("[SignalR] Error in trade handler callback:", err);
      }
    });
  });

  connection.on("OnBalanceUpdated", (data: LiveBalanceUpdatedEvent) => {
    balanceHandlers.forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        console.error("[SignalR] Error in balance handler callback:", err);
      }
    });
  });

  connection.onreconnecting(() => {
    statusHandlers.forEach((h) => h(false));
  });

  connection.onreconnected(() => {
    statusHandlers.forEach((h) => h(true));
  });

  connection.onclose(() => {
    statusHandlers.forEach((h) => h(false));
  });

  try {
    await connection.start();
    statusHandlers.forEach((h) => h(true));
  } catch (err) {
    console.warn("[SignalR] Không thể kết nối tới TradeNotificationHub:", err);
    statusHandlers.forEach((h) => h(false));
  }
}
