# UI Benchmark — Reference Contract (TradingView)

Fidelity: **same-spirit** — mượn structure/pattern, không pixel-match, không đổi palette/token.

## Mượn

- **Nav**: desktop = left icon rail (icons only, flyout cho group children); mobile giữ bottom bar.
- **Hero**: symbol header là flat strip — price + OHLC inline, không card/boxed stat cells.
- **Rail**: watchlist-style quiet table (symbol | last | chg%); chrome gọn tối đa.
- **Toolbar**: controls đơn sắc; accent màu CHỈ trên state active, và active = text color, không pill fill.

## Không mượn

- Light theme, sell/buy buttons, drawing tools, feature scope của TV.
- Multi-symbol watchlist (rail mình là single-BTC theo marketScope — giữ chức năng search/filter hiện có).

## Giữ của mình

- Dark slate palette + semantic tokens R7 (amber=warning, emerald/rose=directional).
- Data, IA, fetch logic — visual-only pass.
