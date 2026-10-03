# Layout Pass — Design Spec (R8)

> Contract cho đợt redesign layout. R7 (color/typography tokens) vẫn là contract
> nền — spec này KHÔNG mở lại quyết định màu; chỉ đụng **density, hierarchy,
> spacing, chrome**.
> Nguyên tắc: **bớt hộp, bớt chữ nhỏ, bớt thứ hiển thị cùng lúc. Không thêm
> chức năng, không đổi logic fetch/render.**

## 0. Baseline đo được (2026-10-03)

| Chỉ số | Giá trị | Vấn đề |
|---|---|---|
| `text-[9px]`+`[10px]`+`[11px]` | **367 hits** | ~1/3 text dưới 12px — nguồn "rối" chính |
| `border` trong `src/components/` | **1487** | hộp trong hộp, mắt đọc viền thay data |
| Nấc nền | `slate-950` → `slate-900` → `slate-800` | 3 nấc quá gần, trang phẳng/lầy |
| Panel cùng hiển thị (Market) | 3 cột ~8+ widget | không có focal point |
| Layout | `lg:grid-cols-12` = 3/6/3 | cột aside tranh ngang hàng chart |

## 1. Hierarchy — một vùng dominant, phần còn lại là rail

- **Chart/replay là focal** trên tab Thị trường: giữ `lg:grid-cols-12` nhưng đổi
  tỉ lệ → watchlist `lg:col-span-3` (giữ), center `xl:col-span-7`, aside
  `xl:col-span-2`→ hoặc aside thu thành rail hẹp hơn; aside KHÔNG được cao/trọng
  hơn center bằng mắt nhìn.
- Hero ticker header (`BinanceTickerHeader`): giữ full-width, `p-5`, giá
  `text-3xl` — không panel nào khác được dùng text lớn hơn `text-lg` trong vùng
  nhìn đầu.
- Heading section toàn app: **một cấp duy nhất** `text-sm font-semibold
  text-slate-200`. Cấm `text-lg/xl` làm heading con — tạo rõ bậc
  hero > section > body.

## 2. Chrome — bỏ border, tách bằng khoảng trắng + nấc nền

Quy tắc "một vùng một viền":
- Border CHỈ còn ở **vùng ngoài cùng** của mỗi panel top-level (card section).
  Mọi phần tử BÊN TRONG card: cấm `border` trang trí — phân tách bằng
  `divide-y divide-slate-800` (list) hoặc chênh nền `bg-slate-900/60` (khối con).
- Con trỏ chuẩn: nested box `border border-slate-800 rounded-lg` →
  `bg-slate-800/40 rounded-lg` (không viền). Stat cells, chips info, block
  "Nguồn & giới hạn" áp dụng cùng rule.
- Tăng tương phản nấc nền: page `bg-slate-950` giữ; top-level card
  `bg-slate-900` giữ; nhưng nested phải xuống `bg-slate-950/60` hoặc
  `bg-slate-800/40` — cấm `bg-slate-900` lồng trong `bg-slate-900`.
- DoD đo được: `grep -ro "border" src/components/` giảm từ 1487 → **≤ 900**
  (không bắt xóa hết — border vẫn đúng ở card ngoài, input, focus ring).

## 3. Density — sàn chữ 12px ngoài data-dense

- **Sàn type: `text-xs` (12px)** cho mọi text thường. `text-[9px]`/`[10px]`/
  `[11px]` CHỈ được phép bên trong: `<table>`/data-grid (`MarketTradesWidget`
  rows, orderbook rows, audit tables), `font-mono` hash/key/metadata lines.
- Ngoài vùng data-dense trên: label dùng `text-xs`, body `text-sm`, KHÔNG có
  text <12px. Caption/hint `text-xs text-slate-500`.
- DoD đo được: `text-[9px]`+`[10px]`+`[11px]` giảm 367 → **≤ 160**, và mọi chỗ
  còn lại nằm trong table/grid/mono context (reviewer verify bằng cách grep
  ngữ cảnh 3 dòng quanh từng hit ở file đổi).
- Line-height: text nhỏ trong list/card `leading-4`→`leading-5` khi sửa.

## 4. Progressive disclosure — ít thứ hiển thị cùng lúc

- Aside rail (`<aside>` trong `BinanceTradingScreen`): các widget phụ sau 2 cái
  đầu (Trades + OrderBook) bọc `<details>` mặc định ĐÓNG hoặc collapse —
  `<summary>` = heading `text-sm font-semibold text-slate-300`, mở mới render
  (nếu component fetch-on-mount thì mount-lazy: chỉ render con khi open — đây là
  ngoại lệ duy nhất được phép đổi logic render, KHÔNG đổi fetch/fn signature).
- Các block "Nguồn, phiên bản & giới hạn"/"Mục đích & giới hạn" đã là
  `<details>` — giữ nguyên, chỉ style lại theo §2/§3.
- Admin panels (`DataManagementPanel`, `DataQualityAdministration`,
  `CausalSmartMoneyAdministration`, `TechnicalEvidenceAdministration`): nhóm nút
  hành động giữ nguyên, nhưng các khối thông tin thứ cấp (taxonomy, audit cutoff,
  limitations dài) chuyển `<details>` hoặc rút còn 1 dòng + expand.

## 5. Spacing

- Top-level grid: `gap-3` → `gap-4` (giữ `items-start`).
- Card section padding: `p-3`/`p-4` → `p-5` cho card top-level; nested vùng con
  `p-3`.
- `space-y-*` giữa các panel trong một cột: `space-y-3` → `space-y-4`.
- Không đụng `sticky top-16`/`h-[780px]`/overflow logic — layout scroll giữ y.

## 6. Kill list — điểm cụ thể (evidence screenshot prod 2026-10-03)

- `MarketTradesWidget`/`OrderBookWidget` trong aside: bọc sau card "Lịch sử
  khớp lệnh", phần còn lại collapse theo §4.
- Stat grid trong `BinanceTickerHeader` (Thay đổi/Cao/Thấp/Khối lượng): cells
  `bg-slate-900 border` → `bg-slate-800/40` không viền, label `text-xs`,
  value `text-sm font-medium tabular-nums`.
- Technical Replay panel: giữ heading "Technical replay · BTCUSDT · 4h" ở
  `text-sm`; block mô tả dài "Chart và toàn bộ layer..." → `text-xs
  text-slate-400`, 1-2 dòng.
- Watchlist sidebar rows: bỏ border trong row, giữ hover `bg-slate-800/60`.
- Banner amber contract + info banner: giữ màu semantic, giảm padding
  `py-2`→`py-2.5`, text `text-xs` — không được to hơn heading section.

## 7. Definition of Done (kiểm chứng được)

- `grep -ro "border" src/components/` ≤ 900.
- `text-[9px]+[10px]+[11px]` ≤ 160 hits, chỉ trong table/mono context.
- Không `bg-slate-900` lồng `bg-slate-900` (grep nested pattern; reviewer
  soi diff thay vì đếm máy).
- Mỗi aside widget sau 2 cái đầu render trong `<details>` đóng mặc định hoặc
  lazy-mount.
- Visual: screenshot ≥4 vùng (Market full, aside rail, 1 admin panel, 1 tab
  Nghiên cứu) — bằng mắt: một vùng nhìn tới đầu tiên là chart/hero; đếm panel
  hiển thị cùng lúc trên Market ≤ 5; không còn chữ <12px ở label/body.
- Gates: `tsc` 0, tests 128/128 (sửa assertion nếu assert text/structure cũ),
  build clean, playwright ≥ baseline.

## 8. Boundary

- CHỈ `frontend/src/**`. KHÔNG đụng backend, data fetching, types, API route,
  logic state ngoài lazy-mount `<details>` cho phép ở §4.
- Không đổi màu/token — mọi màu đã chuẩn theo R7 spec; phát hiện chỗ nào R7 bỏ
  sót thì FIX theo R7 (amber chỉ warning, v.v.) chứ không sáng tạo.
- Không thêm dependency, không commit/push.
- Giữ nguyên behavior responsive breakpoint (`lg:`/`xl:`) — chỉ chỉnh tỉ lệ
  cột trong breakpoint hiện có.
