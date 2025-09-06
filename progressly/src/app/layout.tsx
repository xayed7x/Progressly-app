import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { inter, playfair_display, roboto_mono } from "./fonts";
import "./globals.css";
import Header from "./_components/Header";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Progressly - The Luxury Productivity App",
  description: "The luxury productivity app for tracking your daily activities and goals.",
  appleWebApp: {
    title: "Progressly",
    capable: true,
    statusBarStyle: "default",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "application-name": "Progressly",
    "msapplication-TileColor": "#000000",
    "msapplication-config": "/browserconfig.xml",
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
