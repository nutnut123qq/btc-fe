import { proxyApiRequest } from "@/lib/serverProxy";

export const runtime = "nodejs";
export const maxDuration = 300;

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function handleProxy(request: Request, context: RouteContext) {
  const { path = [] } = await context.params;
  if (path.length === 1 && path[0] === "_upstream-health") {
    return proxyApiRequest(request, ["health", "ready"], {
      customProxyHeader: "node-canary",
      timeoutMs: 10_000,
    });
  }
  return proxyApiRequest(request, path);
}

export async function GET(request: Request, context: RouteContext) {
  return handleProxy(request, context);
}

export async function HEAD(request: Request, context: RouteContext) {
  return handleProxy(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return handleProxy(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return handleProxy(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleProxy(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return handleProxy(request, context);
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "x-btc-proxy": "node",
      "allow": "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS",
    },
  });
}
