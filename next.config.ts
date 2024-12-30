import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  compiler: {
    styledComponents: true,
  }
};
export default nextConfig;

