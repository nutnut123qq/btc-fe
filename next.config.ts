import type { NextConfig } from "next";
import path from "path";

type NextBuildEnv = {
  BACKEND_INTERNAL_URL?: string;
  NEXT_STANDALONE?: string;
  NODE_ENV?: string;
};

export function createNextConfig(env: NextBuildEnv = process.env as NextBuildEnv): NextConfig {
  const backendUrl = (env.BACKEND_INTERNAL_URL || "http://127.0.0.1:5197").replace(/\/+$/, "");
  return {
    ...(env.NEXT_STANDALONE === "1" ? { output: "standalone" as const } : {}),
    turbopack: {
      root: path.resolve("."),
    },
    async rewrites() {
      return [
        {
          source: "/hubs/:path*",
          destination: `${backendUrl}/hubs/:path*`,
        },
      ];
    },
    async headers() {
      return [
        {
          source: "/(.*)",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "DENY" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
            {
              key: "Content-Security-Policy",
              value: [
                "default-src 'self'",
                env.NODE_ENV === "development"
                  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                  : "script-src 'self' 'unsafe-inline'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data:",
                "connect-src 'self' wss://stream.binance.com:9443",
                "object-src 'none'",
                "base-uri 'self'",
                "frame-ancestors 'none'",
              ].join("; "),
            },
          ],
        },
      ];
    },
  };
}

export default createNextConfig();
