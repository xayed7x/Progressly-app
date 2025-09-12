// In app/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils"; // Make sure you have this Shadcn utility

const scenes = [
  {
    headline: "Own Your Day. Master Your Life.",
    subtext:
      "The AI-powered guardian that guides you from where you are to where you dream to be.",
    image: "/images/scene-1.png",
  },
  {
    headline: "Track Your 24 Hours with Zero Friction.",
    subtext:
      "Log your entire day with an intelligent, fast, and beautiful interface designed for clarity.",
    image: "/images/scene-2.png",
  },
  {
    headline: "Discover Where Your Time Truly Goes.",
    subtext:
      "Our AI analyzes your patterns to provide powerful insights, helping you align your actions with your ambitions.",
    image: "/images/scene-3.png",
  },
  {
    headline: "Build the Discipline for Success.",
    subtext:
      "Small, consistent steps lead to remarkable results. Start building your future, one hour at a time.",
    image: "/images/scene-4.png",
  },
];

export default function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  // Client-side authentication check and redirect
  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        router.replace('/dashboard');
      }
    }
  }, [isLoaded, isSignedIn, router]);

  const callback = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % scenes.length);
  };
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    const tick = () => {
      savedCallback.current();
    };
    const interval = setInterval(tick, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
  };

  const activeScene = scenes[activeIndex];

  return (
    <main className="relative h-[calc(100vh-4rem)] w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.5 }}
          transition={{ duration: 1.0 }}
        >
          {/* Background Image */}
          {activeScene.image ? (
            <Image
              src={activeScene.image}
              alt={activeScene.headline}
              fill // This makes the image fill the parent div
              className="object-cover brightness-[0.7]" // object-cover prevents distortion, brightness helps text stand out
            />
          ) : (
            // Fallback for scenes without an image
            <div className="absolute inset-0 bg-primary" />
          )}

          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Text Content & Navigation */}
          <div className="relative z-10 flex h-full flex-col items-center justify-end p-6 text-center md:p-12">
            <div className="max-w-3xl">
              <h1 className="font-serif text-4xl font-bold leading-tight text-secondary md:text-6xl">
                {activeScene.headline}
              </h1>
              <p className="mt-4 text-lg text-white-soft/80 md:text-xl">
                {activeScene.subtext}
              </p>
            </div>

            {/* Navigation Dots with Timer Animation */}
            <div className="mt-12 flex w-full items-center justify-center gap-3">
              {scenes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={cn(
                    "h-2 rounded-full transition-width duration-300", // Animate width changes
                    {
                      "w-8 bg-white/40": activeIndex === index,
                      "w-2 bg-white/40 hover:bg-white/60":
                        activeIndex !== index,
                    }
                  )}
                >
                  {/* The animated gold bar, only rendered for the active dot */}
                  {activeIndex === index && (
                    <motion.div
                      className="h-full rounded-full bg-accent"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 5, ease: "linear" }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
