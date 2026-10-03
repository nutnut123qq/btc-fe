# Per-screen composition pass

Reference: trang Thị trường (in-app, commit `cd3b938`). Mục tiêu: một app trông như thiết kế bởi 1 người.
Card internals theo `card-grammar.md` — không định nghĩa lại.

## Ngôn ngữ chung

- Mỗi trang đúng MỘT vùng dominant (~60–70% viewport).
- Page header: title `text-lg` + desc 1 dòng (`truncate`, mobile `hidden sm:block`) + action gọn phải.
- Empty state = collapse: 1 dòng compact (`rounded bg-slate-800/40 px-4 py-2.5 text-xs`) ghi trạng thái + pipeline nào chưa chạy. Cấm card lớn chứa mỗi số 0.
- Sub-tab: active underline (`text-teal-300` + `border-b-2 border-teal-400`), cấm pill fill.

## Focal per page

### P1 — Tin tức & AI
- **Tin tức**: focal = feed bài viết. Filter nguồn + trạng thái freshness = strip ngang 1 dòng dưới header, không pill fill. Empty = 1 dòng (RSS worker/PostgreSQL chưa chạy).
- **AI**: focal = nút phân tích + kết quả multi-agent. Header chuẩn, CTA bỏ gradient/shadow, `tech_evidence` map mono-key → label người.

### P2 — Nghiên cứu
- **Nghiên cứu**: focal = coverage timeline (3 cột 1h/4h/1d) + data-quality ledger. 4 stat "0" card → chỉ render khi >0, rỗng thì collapse vào 1 dòng. Sub-tab chips → underline.
- **Mẫu nến / Rules nến / Backtest**: focal = kết quả tìm kiếm/explorer; header chuẩn + empty collapse.

### P3 — Mô phỏng
- **Dự đoán**: focal = kết quả dự đoán hiện tại + history; control/config → strip gọn.
- **Paper / Nhật ký Paper BTC**: focal = bảng trades/quan sát; stats phụ → metric row.

### P4 — Hệ thống
- **Cảnh báo**: admin page — status card theo grammar + empty collapse + header chuẩn. Không over-design.
