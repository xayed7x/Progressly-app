// next.config.mjs
import pwa from "@ducanh2912/next-pwa";

const withPWA = pwa({
  dest: "public",
  // --- THIS IS THE CRITICAL CHANGE ---
  // We are telling the service worker to NOT skip the 'waiting' phase.
  // This gives our app time to show the "Update Available" prompt.
  skipWaiting: false,
  // --- END CHANGE ---
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: true,
  },
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "pages-cache",
        cacheableResponse: {
          statuses: [200],
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
};

export default withPWA(nextConfig);