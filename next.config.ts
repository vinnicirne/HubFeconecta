import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['recharts', 'es-toolkit', 'react-smooth']
};

export default nextConfig;
