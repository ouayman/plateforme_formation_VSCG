/** @type {import('next').NextConfig} */
import { watchOptionsForDev } from "./scripts/file-watcher-polling.mjs";

const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  webpack: (config, { dev }) => {
    if (dev) {
      const watchOptions = watchOptionsForDev();
      if (watchOptions) {
        config.watchOptions = watchOptions;
      }
    }
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};

export default nextConfig;
