import pwa from "@ducanh2912/next-pwa";

const withPWA = pwa({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: true,
  },
  // --- ADD THIS SECTION ---
  // This is the fix for the PWA authentication flash.
  runtimeCaching: [
    {
      // This rule applies to all navigation requests (i.e., loading the page itself).
      urlPattern: ({ request }) => request.mode === "navigate",
      // Use "NetworkFirst" strategy.
      // 1. Try to get the latest page from the network.
      // 2. If the network fails (offline), fall back to the cached version.
      handler: "NetworkFirst",
      options: {
        // Name of the cache for pages.
        cacheName: "pages-cache",
        // Only cache successful (status 200) responses.
        cacheableResponse: {
          statuses: [200],
        },
      },
    },
  ],
  // --- END OF ADDED SECTION ---
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Your existing Next.js config options can go here if you have any
};

export default withPWA(nextConfig);