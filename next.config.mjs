import pwa from '@ducanh2912/next-pwa';

const withPWA = pwa({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  // disable: process.env.NODE_ENV === 'development', // Disable PWA in dev mode for faster reloads
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Your existing Next.js config options can go here if you have any
};

export default withPWA(nextConfig);
