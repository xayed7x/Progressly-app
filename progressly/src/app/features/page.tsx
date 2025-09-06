import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features - Time Tracking & Productivity Tools",
  description: "Discover Progressly's powerful features: AI-powered time tracking, goal setting, progress analytics, and productivity insights to help you achieve your goals.",
  openGraph: {
    title: "Progressly Features - Time Tracking & Productivity Tools",
    description: "Discover Progressly's powerful features: AI-powered time tracking, goal setting, progress analytics, and productivity insights to help you achieve your goals.",
    url: "https://progressly-app.vercel.app/features",
  },
  twitter: {
    title: "Progressly Features - Time Tracking & Productivity Tools",
    description: "Discover Progressly's powerful features: AI-powered time tracking, goal setting, progress analytics, and productivity insights to help you achieve your goals.",
  },
};

export default function FeaturesPage() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-serif text-4xl font-bold text-secondary mb-6">
          Powerful Features for Peak Productivity
        </h1>
        
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="bg-secondary/5 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-secondary mb-4">
              AI-Powered Time Tracking
            </h2>
            <p className="text-textLight/80">
              Intelligent activity logging with smart categorization and pattern recognition to help you understand where your time really goes.
            </p>
          </div>
          
          <div className="bg-secondary/5 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-secondary mb-4">
              Goal Setting & Progress Tracking
            </h2>
            <p className="text-textLight/80">
              Set meaningful goals and track your progress with visual analytics and insights that keep you motivated and on track.
            </p>
          </div>
          
          <div className="bg-secondary/5 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-secondary mb-4">
              Beautiful Analytics Dashboard
            </h2>
            <p className="text-textLight/80">
              Visualize your productivity patterns with elegant charts and reports that reveal actionable insights about your habits.
            </p>
          </div>
          
          <div className="bg-secondary/5 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-secondary mb-4">
              Progressive Web App
            </h2>
            <p className="text-textLight/80">
              Access Progressly anywhere with our PWA - works offline, installs on any device, and provides a native app experience.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
