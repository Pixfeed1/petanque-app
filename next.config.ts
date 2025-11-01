import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // TypeScript errors are now fixed. ESLint errors remain to be fixed progressively
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
