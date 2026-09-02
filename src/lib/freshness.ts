export function dataAgeMs(timestamp: string, nowMs = Date.now()): number {
  const parsed = Date.parse(timestamp);
  return Number.isFinite(parsed) ? Math.max(0, nowMs - parsed) : Number.POSITIVE_INFINITY;
}

export function isDataStale(timestamp: string, maxAgeMs: number, nowMs = Date.now()): boolean {
  return dataAgeMs(timestamp, nowMs) > maxAgeMs;
}

export function formatDataAge(timestamp: string, nowMs = Date.now()): string {
  const ageMs = dataAgeMs(timestamp, nowMs);
  if (!Number.isFinite(ageMs)) return "không rõ thời điểm";
  const minutes = Math.floor(ageMs / 60_000);
  if (minutes < 1) return "vừa cập nhật";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}
