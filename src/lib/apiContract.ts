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
