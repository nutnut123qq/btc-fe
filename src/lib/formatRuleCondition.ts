/** Điều kiện rule discovery (khớp backend SequenceRuleCondition). */
export type SequenceRuleCondition = {
  type: string;
  direction?: string | null;
  count?: number | null;
  operator?: string | null;
  reference?: string | null;
  period?: number | null;
  multiplier?: number | null;
  value?: number | null;
  side?: string | null;
  position?: string | null;
  barOffset?: number | null;
};

const OP_VI: Record<string, string> = {
  gt: ">",
  gte: "≥",
  lt: "<",
  lte: "≤",
  eq: "=",
};

const TYPE_LABEL: Record<string, string> = {
  volume_compare: "Khối lượng",
  body_ratio: "Thân nến",
  range_compare: "Biên độ",
  shadow_ratio: "Bóng nến",
  close_position: "Vị trí đóng cửa",
  consecutive_bars: "Chuỗi nến",
};

const DIRECTION_VI: Record<string, string> = {
  green: "xanh",
  red: "đỏ",
  higher_close: "close tăng dần",
  lower_close: "close giảm dần",
};

const POSITION_VI: Record<string, string> = {
  top_25: "gần đỉnh nến (25% trên)",
  top_50: "nửa trên nến",
  bottom_25: "gần đáy nến (25% dưới)",
  bottom_50: "nửa dưới nến",
  middle: "giữa nến",
};

function opSymbol(op?: string | null): string {
  return OP_VI[(op ?? "gt").toLowerCase()] ?? ">";
}

function barContext(offset?: number | null): string {
  if (offset == null || offset === 0) return "Nến đang xét (vừa đóng)";
  if (offset < 0) return `Nến ${Math.abs(offset)} cây trước`;
  return `Nến ${offset} cây sau`;
}

function pct(mult?: number | null): string {
  if (mult == null) return "";
  return `${Math.round(mult * 100)}%`;
}

export function formatRuleCondition(c: SequenceRuleCondition): {
  title: string;
  detail: string;
  kind: string;
} {
  const type = (c.type ?? "").toLowerCase();
  const op = opSymbol(c.operator);
  const offsetNote = c.barOffset != null && c.barOffset !== 0 ? ` · ${barContext(c.barOffset)}` : "";

  switch (type) {
    case "volume_compare": {
      const ref = (c.reference ?? "sma").toLowerCase();
      const period = c.period ?? 20;
      const mult = c.multiplier ?? 1;
      let refText: string;
      if (ref === "sma") refText = `trung bình ${period} nến`;
      else if (ref === "prev") refText = "nến trước";
      else if (ref === "max10") refText = "max 10 nến gần nhất";
      else refText = ref;
      return {
        kind: "volume",
        title: "Khối lượng (volume)",
        detail: `Volume ${op} ${pct(mult)} ${refText}${offsetNote}`,
      };
    }

    case "body_ratio": {
      const pctBody = c.value != null ? Math.round(c.value * 100) : 55;
      return {
        kind: "body",
        title: "Thân nến",
        detail: `|Close − Open| / (High − Low) ${op} ${pctBody}% — nến thân dày, không phải Doji${offsetNote}`,
      };
    }

    case "range_compare": {
      const period = c.period ?? 5;
      const mult = c.multiplier ?? 1;
      const refText = (c.reference ?? "avg").toLowerCase() === "avg" ? `TB biên độ ${period} nến` : c.reference ?? "chuẩn";
      return {
        kind: "range",
        title: "Biên độ (high − low)",
        detail: `Biên nến ${op} ${pct(mult)} ${refText}${offsetNote}`,
      };
    }

    case "shadow_ratio": {
      const side = (c.side ?? "upper").toLowerCase() === "lower" ? "dưới" : "trên";
      const mult = c.multiplier ?? 1.5;
      return {
        kind: "shadow",
        title: `Bóng ${side}`,
        detail: `Bóng ${side} ${op} ${mult}× thân nến${offsetNote}`,
      };
    }

    case "close_position": {
      const pos = POSITION_VI[(c.position ?? "top_25").toLowerCase()] ?? c.position ?? "—";
      return {
        kind: "close",
        title: "Vị trí đóng cửa",
        detail: `Close nằm ${pos}${offsetNote}`,
      };
    }

    case "consecutive_bars": {
      const count = c.count ?? 2;
      const dir = DIRECTION_VI[(c.direction ?? "").toLowerCase()] ?? c.direction ?? "—";
      return {
        kind: "sequence",
        title: "Chuỗi nến liên tiếp",
        detail: `Ít nhất ${count} nến ${dir} (tính ngược từ nến hiện tại)${offsetNote}`,
      };
    }

    default:
      return {
        kind: "other",
        title: TYPE_LABEL[type] ?? c.type ?? "Điều kiện",
        detail: JSON.stringify(c),
      };
  }
}

export function parseRuleConditions(conditionsJson?: string | null): SequenceRuleCondition[] {
  if (!conditionsJson) return [];
  try {
    const parsed = JSON.parse(conditionsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
