import type { Metadata } from "next";

export const metadata: Metadata = {
  // Basic SEO Meta Tags
  title: {
    default: "Progressly - Track Your 24 Hours & Achieve Your Goals",
    template: "%s | Progressly"
  },
  description: "Progressly helps achievers track their 24 hours, plan better, and progress toward their goals. The AI-powered productivity app for time tracking, daily planning, and progress monitoring.",
  keywords: [
    "time tracking",
    "daily planner", 
    "productivity",
    "progress tracking",
    "PWA planner",
    "activity log app",
    "progressly",
    "goal tracking",
    "time management",
    "productivity tracker",
    "daily activities",
    "habit tracker"
  ],
  authors: [{ name: "Progressly Team" }],
  creator: "Progressly",
  publisher: "Progressly",
  
  // Canonical URL and robots
  metadataBase: new URL("https://progressly-app.vercel.app"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Open Graph Tags for Social Sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://progressly-app.vercel.app",
    title: "Progressly - Track Your 24 Hours & Achieve Your Goals",
    description: "Check your time and reach your goals. Progressly helps you track your 24 hours, plan better, and make progress toward your goals with AI-powered insights.",
    siteName: "Progressly",
    images: [
      {
        url: "/images/logo.png",
        width: 1200,
        height: 630,
        alt: "Progressly - Track Your 24 Hours & Achieve Your Goals",
      },
    ],
  },

  // Twitter Card Tags
  twitter: {
    card: "summary_large_image",
    title: "Progressly - Track Your 24 Hours & Achieve Your Goals",
    description: "Check your time and reach your goals. Progressly helps you track your 24 hours, plan better, and make progress toward your goals with AI-powered insights.",
    images: ["/images/logo.png"],
    creator: "@xayed007",
    site: "@xayed007",
  },

  // PWA and Mobile App Meta Tags
  appleWebApp: {
    title: "Progressly",
    capable: true,
    statusBarStyle: "default",
  },
  
  // Additional Meta Tags
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "application-name": "Progressly",
    "msapplication-TileColor": "#000000",
    "msapplication-config": "/browserconfig.xml",
    "format-detection": "telephone=no",
    "apple-mobile-web-app-title": "Progressly",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};