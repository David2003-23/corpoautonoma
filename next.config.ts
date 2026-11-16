import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // App de inventario (PWA estática en public/inventario)
  async redirects() {
    return [
      { source: "/inventario", destination: "/inventario/index.html", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "corpoautonoma.com",
      },
    ],
  },
};

export default nextConfig;
