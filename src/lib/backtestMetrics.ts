// Both backtest writers store ProfitFactor = 99.9 when no trade lost money
// (backend EnsembleBacktestService, ai/backtest_strategy.py): a convention, not a measured ratio.
export const NO_LOSS_PROFIT_FACTOR = 99.9;

// The detail ledger is capped (BacktestController takes ≤ 1000 trades), so only a loss
// among the loaded trades can contradict the convention; a truncated ledger without one keeps it.
export function profitFactorView(profitFactor: number, trades: readonly { pnlPct: number }[]): { text: string; note: string | null } {
  if (profitFactor === NO_LOSS_PROFIT_FACTOR && !trades.some((t) => t.pnlPct < 0)) {
    return { text: "Không có lệnh lỗ", note: `quy ước ${NO_LOSS_PROFIT_FACTOR}` };
  }
  return { text: profitFactor.toFixed(2), note: null };
}
