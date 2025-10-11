// next.config.mjs
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add this line to resolve the lockfile warning
  outputFileTracingRoot: path.resolve(__dirname, '../'),
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://progressly-api.onrender.com/api/:path*',
      },
    ]
  },
};

export default nextConfig;
