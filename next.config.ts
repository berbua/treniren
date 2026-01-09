import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Experimental features for better stability with Turbopack
  experimental: {
    // Improve chunk loading and package optimization
    optimizePackageImports: ['recharts', '@prisma/client'],
  },
};

export default nextConfig;
