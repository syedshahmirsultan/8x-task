import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Catalog photos come from images.unsplash.com, and the admin panel
    // accepts any https image URL, so every https host is allowed. Admin
    // uploads are served locally from /api/images/[id].
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
