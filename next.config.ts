import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'graph.facebook.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // For Google Drive images if needed
      }
    ],
  },
};

export default nextConfig;
