import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["images.pexels.com"],
  },
  serverExternalPackages: ["PDFKit"],
};

export default nextConfig;
