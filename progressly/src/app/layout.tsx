'use client';

import type { Metadata } from "next";
import { inter, playfair_display, roboto_mono } from "./fonts";
import "./globals.css";
import Providers from "./Providers";
import { useState } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types_db';
import { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [supabaseClient] = useState(() => createPagesBrowserClient<Database>());
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${playfair_display.variable} ${roboto_mono.variable}`}
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
      <body className="flex flex-col h-screen">
        <SessionContextProvider supabaseClient={supabaseClient as unknown as SupabaseClient<any, 'public'>}>
          <Providers>{children}</Providers>
        </SessionContextProvider>
      </body>
    </html>
  );
}
