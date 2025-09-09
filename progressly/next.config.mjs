// next.config.mjs
import pwa from "@ducanh2912/next-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const withPWA = pwa({
  dest: "public",
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development to prevent caching issues
  register: true, // Ensure service worker registration
  skipWaiting: false,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: process.env.NODE_ENV === "production",
  },
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        cacheableResponse: {
          statuses: [200, 307, 308], // Add 307 and 308 to allow caching of redirects
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add this line to resolve the lockfile warning
  outputFileTracingRoot: path.resolve(__dirname, '../'),
};

export default withPWA(nextConfig);