import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [],
  serverActions: {
    allowedOrigins: ["*.projectcues.com", "localhost:3000"]
  }
};

export default nextConfig;
