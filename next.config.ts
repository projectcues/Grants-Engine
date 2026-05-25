import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      allowedOrigins: ["grants.projectcues.com", "localhost:3011", "localhost:3000"]
    }
  }
};

export default nextConfig;
