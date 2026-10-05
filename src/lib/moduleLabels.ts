// Vietnamese display labels for backend module identifiers.
// The raw id is evidence identity — callers keep it visible (mono secondary
// text or title attr); these helpers only add a readable prefix.

const MODULE_LABELS: Record<string, string> = {
  causalSmc: "SMC nhân quả",
  candlePatterns: "Mẫu nến",
  technicalIndicators: "Chỉ báo kỹ thuật",
  volumeAnomaly: "Volume bất thường",
  volumeProfile: "Volume profile",
  fibonacci: "Fibonacci",
  marketRegime: "Regime thị trường",
};

/** Friendly label for a bare module id; unknown ids pass through unchanged. */
export function moduleLabel(moduleId: string): string {
  return MODULE_LABELS[moduleId] ?? moduleId;
}

/** Label a `module:EVENT_ID` reference as `Nhãn · EVENT_ID`; bare ids get the plain label. */
export function moduleRefLabel(ref: string): string {
  const sep = ref.indexOf(":");
  if (sep < 0) return moduleLabel(ref);
  return `${moduleLabel(ref.slice(0, sep))} · ${ref.slice(sep + 1)}`;
}
