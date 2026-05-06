import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@chi-digo/design-system"],
  turbopack: {},
};

export default nextConfig;
