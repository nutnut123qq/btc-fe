export type ArchetypeDirection = -1 | 0 | 1;

export function getDirectionText(direction: number | null): "TĂNG" | "GIẢM" | "ĐI NGANG" | "CHƯA CÓ" {
  if (direction === 1) return "TĂNG";
  if (direction === -1) return "GIẢM";
  if (direction === 0) return "ĐI NGANG";
  return "CHƯA CÓ";
}

export function isDirectionMatch(
  actualDirection: number | null,
  dominantDirection: number | null,
): boolean | null {
  if (actualDirection == null || dominantDirection == null) return null;
  return actualDirection === dominantDirection;
}
