export function requireRecord(value: unknown, context: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`INVALID_API_RESPONSE: ${context} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function requireArray<T>(value: unknown, context: string): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`INVALID_API_RESPONSE: ${context} must be an array`);
  }
  return value as T[];
}

export function requireArrayField<T>(
  value: unknown,
  field: string,
  context: string,
): { record: Record<string, unknown>; items: T[] } {
  const record = requireRecord(value, context);
  return { record, items: requireArray<T>(record[field], `${context}.${field}`) };
}

function requireNonBlankString(value: unknown, context: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`INVALID_API_RESPONSE: ${context} must be a nonblank string`);
  }
  return value;
}

function requireFiniteNumber(value: unknown, context: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`INVALID_API_RESPONSE: ${context} must be a finite number`);
  }
  return value;
}

function requireNullableString(value: unknown, context: string): void {
  if (value !== null && typeof value !== "string") {
    throw new Error(`INVALID_API_RESPONSE: ${context} must be null or a string`);
  }
}

function requireNullableNumber(value: unknown, context: string): void {
  if (value !== null) requireFiniteNumber(value, context);
}

export function requireLiveHealth(value: unknown): Record<string, unknown> {
  const record = requireRecord(value, "health live");
  if (record.status !== "healthy") {
    throw new Error("INVALID_API_RESPONSE: health live.status must be healthy");
  }
  requireNonBlankString(record.checkedAtUtc, "health live.checkedAtUtc");
  return record;
}

export function requireReadyHealth(value: unknown): Record<string, unknown> {
  const record = requireRecord(value, "health ready");
  if (record.status !== "ready" && record.status !== "not_ready") {
    throw new Error("INVALID_API_RESPONSE: health ready.status is invalid");
  }
  if (typeof record.databaseReachable !== "boolean") {
    throw new Error("INVALID_API_RESPONSE: health ready.databaseReachable must be boolean");
  }
  requireNonBlankString(record.checkedAtUtc, "health ready.checkedAtUtc");
  requireFiniteNumber(record.responseTimeMs, "health ready.responseTimeMs");
  return record;
}

export function requireFreshnessHealth(value: unknown): Record<string, unknown> {
  const record = requireRecord(value, "health freshness");
  if ((record.status !== "healthy" && record.status !== "degraded") || record.databaseReachable !== true) {
    throw new Error("INVALID_API_RESPONSE: health freshness status is invalid");
  }
  requireNonBlankString(record.checkedAtUtc, "health freshness.checkedAtUtc");
  requireNonBlankString(record.symbol, "health freshness.symbol");
  const klines = requireArray<Record<string, unknown>>(record.klines, "health freshness.klines");
  klines.forEach((item, index) => {
    const context = `health freshness.klines[${index}]`;
    const kline = requireRecord(item, context);
    requireNonBlankString(kline.timeframe, `${context}.timeframe`);
    if (!new Set(["fresh", "stale", "missing"]).has(String(kline.status))) {
      throw new Error(`INVALID_API_RESPONSE: ${context}.status is invalid`);
    }
    requireNullableString(kline.latestOpenTimeUtc, `${context}.latestOpenTimeUtc`);
    requireNullableNumber(kline.ageSeconds, `${context}.ageSeconds`);
    requireFiniteNumber(kline.maxAgeSeconds, `${context}.maxAgeSeconds`);
  });
  return record;
}

export function requireWorkersHealth(value: unknown): Record<string, unknown> {
  const record = requireRecord(value, "health workers");
  requireNonBlankString(record.checkedAtUtc, "health workers.checkedAtUtc");
  const workers = requireArray<Record<string, unknown>>(record.workers, "health workers.workers");
  workers.forEach((item, index) => {
    const context = `health workers.workers[${index}]`;
    const worker = requireRecord(item, context);
    requireNonBlankString(worker.name, `${context}.name`);
    if (!new Set(["healthy", "stale", "failed", "never"]).has(String(worker.status))) {
      throw new Error(`INVALID_API_RESPONSE: ${context}.status is invalid`);
    }
    requireNullableString(worker.lastStartedAtUtc, `${context}.lastStartedAtUtc`);
    requireNullableString(worker.lastSucceededAtUtc, `${context}.lastSucceededAtUtc`);
    requireNullableString(worker.lastFailedAtUtc, `${context}.lastFailedAtUtc`);
    requireNullableNumber(worker.ageSeconds, `${context}.ageSeconds`);
    requireFiniteNumber(worker.maxAgeSeconds, `${context}.maxAgeSeconds`);
    requireNullableNumber(worker.lastDurationMs, `${context}.lastDurationMs`);
    requireNullableString(worker.message, `${context}.message`);
  });
  return record;
}

const AUDIT_NUMBER_FIELDS = [
  "totalKlines", "missingBars", "gapRangeCount", "dataCoveragePct", "largestGapMs",
  "pendingGapCount", "unavailableGapCount",
] as const;

const AUDIT_INVENTORY_FIELDS = [
  "candlePatterns", "technicalIndicators", "windowVectors", "mlFeatureStores",
  "priceTargets", "windowClassificationDatasets",
] as const;

export function requireDataAudit(value: unknown): Record<string, unknown> {
  const record = requireRecord(value, "data audit");
  requireNonBlankString(record.symbol, "data audit.symbol");
  requireNonBlankString(record.generatedAtUtc, "data audit.generatedAtUtc");
  requireRecord(record.news, "data audit.news");
  requireRecord(record.rulesAlerts, "data audit.rulesAlerts");
  const timeframes = requireArray<Record<string, unknown>>(record.timeframes, "data audit.timeframes");
  timeframes.forEach((item, index) => {
    const context = `data audit.timeframes[${index}]`;
    const timeframe = requireRecord(item, context);
    requireNonBlankString(timeframe.timeframe, `${context}.timeframe`);
    AUDIT_NUMBER_FIELDS.forEach((field) => requireFiniteNumber(timeframe[field], `${context}.${field}`));
    AUDIT_INVENTORY_FIELDS.forEach((field) => requireNullableNumber(timeframe[field], `${context}.${field}`));
    if (timeframe.gapLedgerStatus !== "Reconciled" && timeframe.gapLedgerStatus !== "LiveFallback") {
      throw new Error(`INVALID_API_RESPONSE: ${context}.gapLedgerStatus is invalid`);
    }
    requireNullableNumber(timeframe.expectedBars, `${context}.expectedBars`);
    requireNullableNumber(timeframe.minOpenTimeMs, `${context}.minOpenTimeMs`);
    requireNullableNumber(timeframe.maxOpenTimeMs, `${context}.maxOpenTimeMs`);
    requireNullableNumber(timeframe.latestCandleAgeSeconds, `${context}.latestCandleAgeSeconds`);
    const gaps = requireArray<Record<string, unknown>>(timeframe.topGaps, `${context}.topGaps`);
    gaps.forEach((item, gapIndex) => {
      const gapContext = `${context}.topGaps[${gapIndex}]`;
      const gap = requireRecord(item, gapContext);
      requireNullableNumber(gap.id, `${gapContext}.id`);
      ["startOpenTimeMs", "endOpenTimeMs", "missingBars", "attemptCount"].forEach((field) =>
        requireFiniteNumber(gap[field], `${gapContext}.${field}`),
      );
      if (gap.status !== null && !new Set(["Pending", "Unavailable", "Filled"]).has(String(gap.status))) {
        throw new Error(`INVALID_API_RESPONSE: ${gapContext}.status is invalid`);
      }
      requireNullableString(gap.nextRetryAtUtc, `${gapContext}.nextRetryAtUtc`);
      requireNullableString(gap.reason, `${gapContext}.reason`);
    });
  });
  return record;
}

export function requireGapRetry(value: unknown): Record<string, unknown> {
  const record = requireRecord(value, "gap retry");
  requireFiniteNumber(record.id, "gap retry.id");
  if (record.status !== "Pending" || record.attemptCount !== 0 || record.nextRetryAtUtc !== null) {
    throw new Error("INVALID_API_RESPONSE: gap retry reset state is invalid");
  }
  requireNonBlankString(record.updatedAtUtc, "gap retry.updatedAtUtc");
  return record;
}

export const EXPECTED_API_CONTRACT_VERSION = "2026-08-phase3";

export function requireAppMeta(value: unknown): Record<string, unknown> {
  const record = requireRecord(value, "app meta");
  ["appVersion", "apiContractVersion", "dataPipelineVersion", "evaluationVersion", "environment"].forEach((field) =>
    requireNonBlankString(record[field], `app meta.${field}`),
  );
  return record;
}

export function isApiContractCompatible(value: { apiContractVersion: string }): boolean {
  return value.apiContractVersion === EXPECTED_API_CONTRACT_VERSION;
}

export type ApiContractState = "checking" | "compatible" | "mismatch" | "unavailable";

export function canUseApiMutations(state: ApiContractState): boolean {
  return state === "compatible";
}

export function requireMutationContract(compatible: boolean): void {
  if (!compatible) throw new Error("API contract chưa được xác nhận; thao tác ghi đã bị khóa.");
}

const VALIDITY_STATUSES = new Set(["Valid", "Legacy", "Invalid"]);

export function isCoreResearchRecord(value: { validityStatus?: unknown; archivedAtUtc?: unknown }): boolean {
  return value.validityStatus === "Valid" && value.archivedAtUtc == null;
}

export function requireVersionedResearchRecord(
  value: Record<string, unknown>,
  context: string,
): Record<string, unknown> {
  if (!VALIDITY_STATUSES.has(String(value.validityStatus))) {
    throw new Error(`INVALID_API_RESPONSE: ${context}.validityStatus is invalid`);
  }
  if (typeof value.pipelineVersion !== "string" || value.pipelineVersion.trim() === "" || typeof value.evaluationVersion !== "string" || value.evaluationVersion.trim() === "") {
    throw new Error(`INVALID_API_RESPONSE: ${context} is missing version metadata`);
  }
  if (value.invalidReason !== null && typeof value.invalidReason !== "string") {
    throw new Error(`INVALID_API_RESPONSE: ${context}.invalidReason must be null or a string`);
  }
  if (value.archivedAtUtc !== null && typeof value.archivedAtUtc !== "string") {
    throw new Error(`INVALID_API_RESPONSE: ${context}.archivedAtUtc must be null or a string`);
  }
  return value;
}

export function requireVersionedResearchItems<T>(
  value: unknown,
  field: string,
  context: string,
): { record: Record<string, unknown>; items: T[] } {
  const { record, items } = requireArrayField<T>(value, field, context);
  items.forEach((item, index) => requireVersionedResearchRecord(requireRecord(item, `${context}.${field}[${index}]`), `${context}.${field}[${index}]`));
  return { record, items };
}

export function requireExperimentalEnsemble(
  value: unknown,
  context: string,
): Record<string, unknown> {
  const record = requireVersionedResearchRecord(requireRecord(value, context), context);
  if (record.validated !== false || record.maturity !== "Experimental" || record.promotionEligible !== false || typeof record.promotionReason !== "string" || record.promotionReason.trim() === "") {
    throw new Error(`INVALID_API_RESPONSE: ${context} is missing experimental promotion metadata`);
  }
  return record;
}

const ACCURACY_NUMBER_FIELDS = [
  "totalPredictions", "evaluatedCount", "trueCount", "falseCount", "pendingCount", "winRatePct",
  "canonicalPredictionCount", "canonicalEvaluatedCount", "canonicalTrueCount", "canonicalFalseCount", "canonicalWinRatePct",
] as const;

export function requireExperimentalAccuracy(value: unknown): Record<string, unknown> {
  const record = requireRecord(value, "prediction accuracy");
  if (record.validated !== false || record.maturity !== "Experimental" || record.promotionEligible !== false || typeof record.promotionReason !== "string" || record.promotionReason.trim() === "") {
    throw new Error("INVALID_API_RESPONSE: prediction accuracy is missing experimental promotion metadata");
  }
  if (ACCURACY_NUMBER_FIELDS.some((field) => typeof record[field] !== "number" || !Number.isFinite(record[field]))) {
    throw new Error("INVALID_API_RESPONSE: prediction accuracy is missing raw or canonical metrics");
  }
  return record;
}

const ENSEMBLE_EVALUATION_NUMBER_FIELDS = [
  "totalPredictions", "trueCount", "falseCount", "pendingCount", "winRatePct",
  "canonicalEvaluatedCount", "canonicalTrueCount", "canonicalFalseCount", "canonicalPendingCount", "canonicalWinRatePct",
  "reevaluatedCount", "reevaluatedTrueCount", "reevaluatedFalseCount", "reevaluatedPendingCount", "reevaluatedWinRatePct",
] as const;

export function requireExperimentalEnsembleSummary(value: unknown): Record<string, unknown> {
  const record = requireRecord(value, "ensemble evaluations");
  if (record.validated !== false || record.maturity !== "Experimental" || record.promotionEligible !== false || typeof record.promotionReason !== "string" || record.promotionReason.trim() === "") {
    throw new Error("INVALID_API_RESPONSE: ensemble evaluations is missing experimental promotion metadata");
  }
  if (ENSEMBLE_EVALUATION_NUMBER_FIELDS.some((field) => typeof record[field] !== "number" || !Number.isFinite(record[field]))) {
    throw new Error("INVALID_API_RESPONSE: ensemble evaluations is missing raw, canonical or re-evaluated metrics");
  }
  requireArray(record.reevaluatedItems, "ensemble evaluations.reevaluatedItems");
  return record;
}

export function safeApiErrorMessage(body: string, status: number): string {
  try {
    const payload = JSON.parse(body) as { code?: unknown };
    const knownMessages: Record<string, string> = {
      LLM_NOT_CONFIGURED: "Giải thích LLM chưa được cấu hình; các chức năng định lượng vẫn hoạt động.",
      AI_SERVICE_UNAVAILABLE: "Dịch vụ giải thích AI tạm thời không khả dụng.",
      AI_SERVICE_TIMEOUT: "Dịch vụ giải thích AI phản hồi quá lâu.",
      AI_ANALYSIS_ERROR: "Phân tích AI chưa thể hoàn tất.",
      ANALYSIS_PIPELINE_ERROR: "Pipeline phân tích AI chưa thể hoàn tất.",
      UNSUPPORTED_SYMBOL: "Tài sản này chưa được hỗ trợ cho phân tích AI.",
      GAP_NOT_FOUND: "Gap dữ liệu không còn tồn tại.",
      GAP_ALREADY_FILLED: "Gap dữ liệu này đã được lấp; không cần retry.",
    };
    if (typeof payload.code === "string" && knownMessages[payload.code]) {
      return knownMessages[payload.code];
    }
  } catch {
    // Error bodies are untrusted and must not be shown verbatim.
  }

  return status >= 500
    ? `Dịch vụ tạm thời không khả dụng (HTTP ${status}).`
    : `Yêu cầu không hợp lệ (HTTP ${status}).`;
}
