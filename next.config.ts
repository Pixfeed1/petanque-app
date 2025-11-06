import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Désactiver ESLint pendant le build en production
    // TODO: Corriger les erreurs ESLint et réactiver
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
