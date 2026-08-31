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
