import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      allowedOrigins: ["*.projectcues.com", "localhost:3000"]
    }
  }
};

export default nextConfig;
