import { proxyApiRequest } from "@/lib/serverProxy";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET(request: Request) {
  return proxyApiRequest(request, ["health", "ready"], {
    customProxyHeader: "node-canary",
    timeoutMs: 10_000,
  });
}
