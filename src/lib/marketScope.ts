// Shared instrument contract — mirrors backend InstrumentCatalog
// (contract "instrument-catalog-v1", GET /api/instruments). Catalog membership only
// declares the contract; `enabled` marks instruments live in production traffic today.
// MBB: HOSE equity, VND, Asia/Ho_Chi_Minh, VCI primary + KBS cross-check, adjusted
// price basis, production timeframes exactly 1h and 1d (no synthetic 4h).

export interface InstrumentCapabilities {
  technicalAnalysis: boolean;
  news: boolean;
  sentiment: boolean;
  futures: boolean;
  liquidation: boolean;
  orderBook: boolean;
  execution: boolean;
  paperTrading: boolean;
}

export interface InstrumentDescriptor {
  symbol: string;
  label: string;
  venue: string;
  assetClass: "crypto" | "equity";
  currency: string;
  timezone: string;
  dataProvider: string;
  crossCheckDataProvider: string | null;
  priceBasis: string;
  aliases: readonly string[];
  activeTimeframes: readonly string[];
  defaultTimeframe: string;
  enabled: boolean;
  capabilities: InstrumentCapabilities;
}

const BTCUSDT_DESCRIPTOR: InstrumentDescriptor = {
  symbol: "BTCUSDT",
  label: "BTC/USDT",
  venue: "Binance Spot",
  assetClass: "crypto",
  currency: "USDT",
  timezone: "UTC",
  dataProvider: "Binance",
  crossCheckDataProvider: null,
  priceBasis: "raw",
  aliases: ["BTC"],
  activeTimeframes: ["1h", "4h", "1d"],
  defaultTimeframe: "4h",
  enabled: true,
  capabilities: {
    technicalAnalysis: true,
    news: true,
    sentiment: true,
    futures: true,
    liquidation: true,
    orderBook: true,
    execution: true,
    paperTrading: true,
  },
};

const MBB_DESCRIPTOR: InstrumentDescriptor = {
  symbol: "MBB",
  label: "MBB (MB Bank)",
  venue: "HOSE",
  assetClass: "equity",
  currency: "VND",
  timezone: "Asia/Ho_Chi_Minh",
  dataProvider: "VCI",
  crossCheckDataProvider: "KBS",
  priceBasis: "adjusted",
  aliases: [],
  activeTimeframes: ["1h", "1d"],
  defaultTimeframe: "1d",
  enabled: false,
  capabilities: {
    technicalAnalysis: true,
    news: false,
    sentiment: false,
    futures: false,
    liquidation: false,
    orderBook: false,
    execution: false,
    paperTrading: false,
  },
};

export const INSTRUMENTS: readonly InstrumentDescriptor[] = [
  BTCUSDT_DESCRIPTOR,
  MBB_DESCRIPTOR,
];

// Enabled production scope — crypto pipelines stay BTCUSDT-only until MBB lanes land.
export const ACTIVE_SYMBOL = "BTCUSDT" as const;
export const ACTIVE_SYMBOL_LABEL = "BTC/USDT" as const;
export const ACTIVE_SYMBOLS = [ACTIVE_SYMBOL] as const;

/** Uppercase/trim and resolve declared aliases (BTC -> BTCUSDT). */
export function canonicalizeSymbol(value: string | null | undefined): string {
  const normalized = (value ?? "").trim().toUpperCase();
  const hit = INSTRUMENTS.find(
    (i) => i.symbol === normalized || i.aliases.includes(normalized),
  );
  return hit?.symbol ?? normalized;
}

/** Descriptor for a known symbol or alias; undefined when unknown (fail closed). */
export function getInstrument(
  value: string | null | undefined,
): InstrumentDescriptor | undefined {
  const canonical = canonicalizeSymbol(value);
  return INSTRUMENTS.find((i) => i.symbol === canonical);
}

export function isKnownSymbol(value: string | null | undefined): boolean {
  return getInstrument(value) !== undefined;
}

export function isEnabledSymbol(value: string | null | undefined): boolean {
  return getInstrument(value)?.enabled === true;
}

export function activeTimeframesFor(
  symbol: string | null | undefined,
): readonly string[] | undefined {
  return getInstrument(symbol)?.activeTimeframes;
}

export function defaultTimeframeFor(
  symbol: string | null | undefined,
): string | undefined {
  return getInstrument(symbol)?.defaultTimeframe;
}

export function isTimeframeActiveFor(
  symbol: string | null | undefined,
  timeframe: string | null | undefined,
): boolean {
  const timeframes = activeTimeframesFor(symbol);
  if (!timeframes) return false;
  return timeframes.includes((timeframe ?? "").trim().toLowerCase());
}

/**
 * Recover persisted/typed selections to the instrument's declared default.
 * UI recovery only — unknown symbols still fail closed through isKnownSymbol /
 * isEnabledSymbol and backend scope filters; this helper deliberately falls back
 * to the BTC display default for malformed/unknown local UI state.
 */
export function normalizeTimeframeFor(
  symbol: string | null | undefined,
  timeframe: string | null | undefined,
): string {
  const normalized = (timeframe ?? "").trim().toLowerCase();
  if (isTimeframeActiveFor(symbol, normalized)) return normalized;
  return defaultTimeframeFor(symbol) ?? BTCUSDT_DESCRIPTOR.defaultTimeframe;
}
