import type { NextConfig } from "next";
import path from "path";

type NextBuildEnv = {
  BACKEND_INTERNAL_URL?: string;
  NEXT_STANDALONE?: string;
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
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
        {
          source: "/hubs/:path*",
          destination: `${backendUrl}/hubs/:path*`,
        },
      ];
    },
  };
}

export default createNextConfig();
