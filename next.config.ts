import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['recharts', 'es-toolkit', 'react-smooth'],
  async rewrites() {
    return [
      {
        source: '/vps-videos/:path*',
        destination: 'http://209.50.229.10:3005/videos/:path*',
      },
    ];
  },
};

export default nextConfig;
