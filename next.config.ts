import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Ignore ESLint errors during build for production
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
