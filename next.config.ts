import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.resolve("."),
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://backend:5197";
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

export default nextConfig;
