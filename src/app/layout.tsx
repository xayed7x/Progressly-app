import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { inter, playfair_display, roboto_mono } from "./fonts";
import "./globals.css";
import Header from "./_components/Header";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Progressly",
  description: "The luxury productivity app.",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Progressly",
  },
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
