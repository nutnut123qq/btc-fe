# UI Polish — Design Spec (R7)

> Contract cho đợt cải tổ giao diện. Mọi worker phải tuân thủ token + quy tắc ở đây.
> Nguyên tắc: **bớt màu, không thêm màu. Chuẩn hóa, không sáng tạo mới.**

## 1. Palette (tối đa 5 họ màu được phép dùng)

| Token | Tailwind | Vai trò — CHỈ được dùng khi |
|---|---|---|
| **neutral** | `slate-*` | BỀ MẶT mặc định: bg, card, border, chữ thường. Text: `slate-50` (chính), `slate-300` (phụ), `slate-400` (label/muted), `slate-500` (hint). Surface: `slate-900`, `slate-800` (raised). Border: `slate-800` hoặc `slate-700`. |
| **accent** | `teal-400/500/600` | TƯƠNG TÁC: link, nút primary, tab active, chip active, focus ring, icon thương hiệu. |
| **up** | `emerald-400/500` | NGỮ NGHĨA: tăng giá, +delta, success, healthy, bullish. |
| **down** | `rose-400/500` | NGỮ NGHĨA: giảm giá, -delta, error, unhealthy, bearish. Gộp `red-*` vào đây. |
| **warn** | `amber-400/500` | CHỈ cảnh báo/attention states thật (alert badge, degraded state). CẤM dùng làm trang trí. |

**Bị cấm**: `cyan`, `indigo`, `violet`, `sky`, `fuchsia`, `orange`, `yellow` — mọi chỗ trang trí/nhãn chức năng phải map về `slate` (trung tính) hoặc `teal` (nếu là interactive/active).

### Mapping rule khi đụng vào class cũ
- `amber-*` ở nút indicator/chip/header trang trí → `slate-*` (inactive) hoặc `teal-*` (active/interactive).
- `amber-*` ở trạng thái cảnh báo thật (degraded, warning text, alert) → GIỮ `amber`.
- `cyan/indigo/violet/sky-*` trang trí → `slate-*`; nếu là active state → `teal-*`.
- `red-*` → `rose-*`.
- `emerald/rose` giữ nguyên nếu đúng nghĩa (up/down); sai nghĩa → `slate`.

## 2. Typography

- Body font: `var(--font-sans)` (Geist Sans) — sửa `globals.css` đang `Arial`.
- Số/tiền/tỷ lệ/thời gian: `font-mono` hoặc `tabular-nums` — giá, delta, volume, timestamps phải tabular để không nhảy cột.
- **Cấm `uppercase`/`tracking-widest` trên text tiếng Việt có dấu.** Label chuẩn: `text-xs font-medium text-slate-400`. Giữ `uppercase` CHỈ cho mã ASCII thuần: ticker `BTC/USDT`, `1h/4h/1d`, `F&G`.
- Heading section: `text-sm font-semibold text-slate-200` (không all-caps, không to hơn cần thiết).
- Hero price (số tiền chính): `text-3xl font-semibold text-slate-50` + `tabular-nums`. **Không tô hồng/đỏ** — màu chỉ cho delta riêng (up/down theo dấu), icon xu hướng giữ màu semantic.

## 3. Layout & spacing

- Card padding chuẩn: `p-4`; hero/header card: `p-5`.
- Khoảng cách giữa card: `gap-3` (chặt) hoặc `gap-4` (chuẩn). Section spacing: `space-y-4`.
- Border: `border border-slate-800`, radius `rounded-xl` (card ngoài) / `rounded-lg` (phần tử trong).
- **Cấm gradient/glow/shadow màu** trừ khi đã có sẵn và đúng nghĩa. Card phẳng, border mảnh.
- Nút/chip: `rounded-lg px-3 py-1.5 text-sm`, inactive `bg-slate-800 text-slate-300 hover:bg-slate-700`, active `bg-teal-500/15 text-teal-300` (hoặc solid teal nếu primary).
- Grid stat (giá 24h/volume...): mỗi cell = label `text-xs text-slate-400` + value `text-sm font-medium text-slate-100 tabular-nums`, card `bg-slate-900 border border-slate-800 rounded-lg p-3`.

## 4. Kill list — điểm cụ thể phải sửa (evidence từ screenshot prod)

- Card vàng "REALTIME MARKET DATA" (`MarketTradesWidget`/`BinanceTradeHistoryScreen`) → card `bg-slate-900 border-slate-800`, tiêu đề `text-sm font-semibold text-slate-200`, badge "Realtime" nhỏ `text-xs text-teal-300`.
- Nhóm nút Indicators/Patterns/Smart Money/Volume Profile/Fibonacci nhiều màu → chip đồng nhất slate, active → teal.
- Giá hero hồng → `text-slate-50`; mũi tên/delta giữ `emerald`/`rose`.
- Header stat ALL-CAPS vi ("THAY ĐỔI 24H", "KHỐI LƯỢNG 24H (USDT)") → sentence-case `text-xs text-slate-400`.
- Nút "Khớp"/"Sổ" amber → slate chips.
- Bottom nav: icon+label active → `text-teal-400`, inactive `text-slate-500`.

## 5. Definition of Done (kiểm chứng được)

- `grep -roh "amber-[0-9]" src` ≤ 60 hits và từng chỗ còn lại là warning state thật.
- `grep -roh "cyan-\|indigo-\|violet-\|sky-\|fuchsia-\|orange-\|yellow-" src` = 0.
- `grep -rn "uppercase" src` chỉ còn ở ticker/ASCII labels.
- `globals.css` body dùng `var(--font-sans)`; giá/stats dùng `tabular-nums`.
- Gates: `npm run build` clean, `npm test` đủ xanh, `npx tsc --noEmit` clean, `npx playwright test` ≥ baseline (6 pass/7 env-skip).
- Evidence: screenshot before/after ≥ 4 vùng (Market header, Trading panel, Trades/Orderbook, 1 tab khác) — nhìn bằng mắt: tối đa 4 màu xuất hiện, không còn card vàng, không all-caps vi.

## Boundary
- CHỈ `frontend/src/**` + `frontend/implementation-specs/**`. KHÔNG đụng backend, logic fetch, data shape, route, test file (trừ khi test assert màu cụ thể — thì sửa assertion cho đúng spec).
- Không commit/push. Không thêm dependency.
