import type { NextConfig } from "next";

// Flask API address. The browser only talks to Next.js; /api/* is proxied to Flask.
const FLASK_URL = process.env.FLASK_URL ?? "http://127.0.0.1:5000";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${FLASK_URL}/api/:path*` }];
  },
};

export default nextConfig;
