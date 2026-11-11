import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  // allowedDevOrigins: ['192.168.1.13:3000', '192.168.1.13'],

  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
}

export default nextConfig;
