import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingExcludes: {
    '*': ['./backend/**/*'],
  },
  webpack: (config) => {
    config.watchOptions = {
      ignored: ['**/backend/**'],
    };
    return config;
  },
};

export default nextConfig;
