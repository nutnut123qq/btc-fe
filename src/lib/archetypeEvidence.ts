import type { ArchetypeOutcomeDto } from "./types";

export type ArchetypeOutcomeLabel = -1 | 0 | 1;

export function getDominantOutcomeLabel(
  outcome: ArchetypeOutcomeDto | null,
): ArchetypeOutcomeLabel | null {
  if (!outcome) return null;
  if (outcome.upRate >= outcome.downRate && outcome.upRate >= outcome.sidewaysRate) return 1;
  if (outcome.downRate >= outcome.upRate && outcome.downRate >= outcome.sidewaysRate) return -1;
  return 0;
}

export function getOutcomeLabelText(label: number): "TĂNG" | "GIẢM" | "NGANG" {
  if (label === 1) return "TĂNG";
  if (label === -1) return "GIẢM";
  return "NGANG";
}

export function isWinningOccurrence(
  actualLabel: number,
  dominantLabel: ArchetypeOutcomeLabel | null,
): boolean | null {
  return dominantLabel == null ? null : actualLabel === dominantLabel;
}
