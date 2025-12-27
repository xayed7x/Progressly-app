'use client';

import { useState } from 'react';
import Image from 'next/image';

// Motivational quotes about consistency - one will be shown per app start
const MOTIVATIONAL_QUOTES = [
  "Success is the sum of small efforts, repeated day in and day out.",
  "It's not what we do once in a while that shapes our lives, but what we do consistently.",
  "The secret of your future is hidden in your daily routine.",
  "Small disciplines repeated with consistency lead to great achievements.",
  "Consistency is the true foundation of trust.",
  "You don't have to be extreme, just consistent.",
  "The compound effect of daily habits is unstoppable.",
  "Progress is the product of daily practice.",
  "Excellence is not an act, but a habit.",
  "Your only limit is the consistency of your actions."
];

export function DashboardLoading() {
  // Select a random quote on component mount (once per app start)
  const [quote] = useState(() => 
    MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
  );

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      {/* Simple static background gradients - no animation for performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-accent/15 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-blue-500/15 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-sm animate-fadeIn">
        {/* Logo with simple CSS animation */}
        <div className="relative animate-pulse-slow">
          {/* Subtle glow */}
          <div className="absolute -inset-3 rounded-xl bg-accent/20 blur-lg" />
          
          {/* Logo Container */}
          <div className="relative w-20 h-20 rounded-xl bg-black/60 flex items-center justify-center border border-white/10">
            <Image
              src="/images/logo.png"
              alt="Progressly"
              width={56}
              height={56}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-xl font-bold text-accent animate-fadeIn">
          Progressly
        </h1>

        {/* Motivational Quote */}
        <p className="text-gray-400 text-center text-sm italic leading-relaxed animate-fadeIn animation-delay-200">
          "{quote}"
        </p>

        {/* Simple Progress Bar with CSS animation */}
        <div className="w-40 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-accent to-blue-500 rounded-full animate-loading-bar" />
        </div>

        {/* Simple loading dots */}
        <div className="flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce-dot" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce-dot" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce-dot" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
