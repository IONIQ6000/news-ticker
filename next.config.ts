import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    turbopack: {
      root: "/opt/news-ticker",
    },
  },
};

export default nextConfig;
