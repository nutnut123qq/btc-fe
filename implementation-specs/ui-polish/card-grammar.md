# Card Grammar (ui-benchmark p3)

Card không được là "API serialize vào hộp". Mỗi card = 1 archetype + 1 anchor.

## 4 archetype

| Type | Cấu trúc |
|---|---|
| **metric** | label (tên người) + VALUE `text-xl/2xl font-semibold tabular-nums` + delta/context `text-xs text-slate-400` |
| **status** | icon + state text + 1 dòng summary. OK/available = **yên tĩnh, không badge, không màu**. Chỉ PARTIAL / error / warning được màu semantic |
| **prose** | heading `text-sm font-semibold text-slate-200` + body `text-xs text-slate-400` |
| **table** | giữ pattern bảng hiện có |

## 3 luật cứng

1. **Mono-key / API field name CẤM làm label** — map sang tên người đọc: `technicalIndicators` → "Chỉ báo kỹ thuật", `volumeAnomaly` → "Bất thường khối lượng", `candlePatterns` → "Mẫu nến", `marketRegime` → "Chế độ thị trường", `fibonacci` → "Fibonacci leg", `volumeProfile` → "Volume Profile", `confluence` → "Điểm hội tụ".
2. **Badge chỉ khi abnormal** — AVAILABLE/OK/healthy không badge không màu; PARTIAL/warning → amber; error/unavailable → rose (mute: `text-slate-400` cho unavailable-plain).
3. **Đúng 1 visual anchor/card** — số lớn | icon | mini chart. Mọi thứ còn lại deemphasize (`text-xs`, `text-slate-400`).

## Scope áp

- Replay layer cards (TechnicalReplayPanel)
- Research audit cards + Data quality rows (ResearchEvidenceScreen / DataManagementPanel)
- Analog comparison cards (ArchetypeEvidencePanel / HistoricalAnalogView) — giữ pattern, chỉ normalize nhẹ.
