import type { NextConfig } from "next";
import "./src/env";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  typedRoutes: true,
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/campaigns',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
