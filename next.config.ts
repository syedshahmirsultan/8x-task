import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Mock product/category images only — swapped for real asset hosting
    // once the backend is wired up.
    remotePatterns: [{ protocol: "https", hostname: "picsum.photos" }],
  },
};

export default nextConfig;
