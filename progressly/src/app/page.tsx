// In app/page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";
import AuthCard from "./_components/AuthCard";

const scenes = [
  {
    image: "/images/scene-1.png",
  },
  {
    image: "/images/scene-2.png",
  },
  {
    image: "/images/scene-3.png",
  },
  {
    image: "/images/scene-4.png",
  },
];

export default function HomePage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  // Client-side authentication check and redirect
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.replace("/dashboard");
      }
    };

    checkAuth();
  }, [router, supabase]);

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

  const activeScene = scenes[activeIndex];

  return (
    <main className="relative h-screen w-full overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        >
          {/* Background Image */}
          {activeScene.image ? (
            <Image
              src={activeScene.image}
              alt="Background"
              fill
              className="object-cover brightness-[0.8]"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-primary" />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        </motion.div>
      </AnimatePresence>

      {/* Logo or Brand Mark at Top */}
      <div className="absolute top-12 left-0 right-0 z-10 flex justify-center">
        <div className="flex flex-col items-center">
           <Image
             src="/images/logo.png"
             alt="Progressly Logo"
             width={60}
             height={60}
             className="drop-shadow-lg"
           />
           <h1 className="mt-2 text-2xl font-bold text-white tracking-wider drop-shadow-md font-serif">
             PROGRESSLY
           </h1>
        </div>
      </div>

      {/* Auth Card Overlay */}
      <AuthCard />
    </main>
  );
}
