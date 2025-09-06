import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { inter, playfair_display, roboto_mono } from "./fonts";
import "./globals.css";
import Header from "./_components/Header";
import { Toaster } from "@/components/ui/toaster";

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
    description: "Progressly helps achievers track their 24 hours, plan better, and progress toward their goals. The AI-powered productivity app for time tracking and daily planning.",
    siteName: "Progressly",
    images: [
      {
        url: "/og-image.png", // TODO: Create this image (1200x630px recommended)
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
    description: "Progressly helps achievers track their 24 hours, plan better, and progress toward their goals. The AI-powered productivity app for time tracking and daily planning.",
    images: ["/og-image.png"], // TODO: Create this image (same as OG image)
    creator: "@xayed007", // TODO: Update with actual Twitter handle
    site: "@xayed007", // TODO: Update with actual Twitter handle
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The ClerkProvider is now removed from here
    <html
      lang="en"
      className={`${inter.variable} ${playfair_display.variable} ${roboto_mono.variable}`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="hWY_M3uBePeRTT9uESKKM-lIlLHCvF7-9tluj1sB_Jw" />
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Progressly",
              "applicationCategory": "ProductivityApplication",
              "operatingSystem": "Any",
              "description": "Progressly helps achievers track their 24 hours, plan better, and progress toward their goals. The AI-powered productivity app for time tracking, daily planning, and progress monitoring.",
              "url": "https://progressly-app.vercel.app",
              "author": {
                "@type": "Organization",
                "name": "Progressly Team"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "150"
              },
              "featureList": [
                "AI-powered time tracking",
                "Goal setting and progress monitoring", 
                "Beautiful analytics dashboard",
                "Progressive Web App (PWA)",
                "Offline functionality",
                "Cross-platform compatibility"
              ]
            })
          }}
        />
      </head>
      <body>
        {" "}
        {/* The provider now goes INSIDE the body */}
        <ClerkProvider>
          <div className="font-sans bg-primary text-textLight min-h-screen">
            <Header />
            {children}
          </div>
        </ClerkProvider>
        <Toaster />
      </body>
    </html>
  );
}
