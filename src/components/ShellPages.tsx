"use client";

import { useRouter } from "next/navigation";
import { MarketScreen } from "./MarketScreen";
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
