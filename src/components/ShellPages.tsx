"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MarketScreen } from "./MarketScreen";
import { EquityScreen } from "./EquityScreen";
import { AiAnalysisScreen } from "./AiAnalysisScreen";
import { AlertSettingsScreen } from "./AlertSettingsScreen";
import { useShellSignals, TAB_PATH } from "./AppShell";
import { canUseApiMutations } from "@/lib/apiContract";

export function MarketPage() {
  const router = useRouter();
  return <MarketScreen onOpenEvidence={() => router.push(TAB_PATH.research)} />;
}

export function AiAnalysisPage() {
  const { aiCapabilities } = useShellSignals();
  return <AiAnalysisScreen capabilities={aiCapabilities} />;
}

export function AlertSettingsPage() {
  const { contractState } = useShellSignals();
  return <AlertSettingsScreen contractCompatible={canUseApiMutations(contractState)} />;
}

// Legacy /mbb keeps rendering the shared equity screen for MBB; picking another
// symbol there navigates to /co-phieu?symbol=X.
export function MbbPage() {
  const { contractState } = useShellSignals();
  return <EquityScreen symbolParam="MBB" legacyMbbRoute contractCompatible={canUseApiMutations(contractState)} />;
}

// /co-phieu — `?symbol=` is the single source of truth (default MBB).
export function EquityPage() {
  const { contractState } = useShellSignals();
  const symbolParam = useSearchParams().get("symbol");
  return <EquityScreen symbolParam={symbolParam} contractCompatible={canUseApiMutations(contractState)} />;
}
