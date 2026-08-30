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
