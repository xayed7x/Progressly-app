'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
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
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-accent/20 rounded-full blur-[120px]"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[120px]"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.2, 0.3]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-md">
        {/* Logo with Pulse Animation */}
        <motion.div
          className="relative"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Outer Glow Ring */}
          <motion.div
            className="absolute -inset-4 rounded-xl bg-gradient-to-r from-accent/30 to-blue-500/30 blur-xl"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Logo Container */}
          <motion.div
            className="relative w-24 h-24 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/10"
            animate={{ 
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 4, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Image
              src="/images/logo.png"
              alt="Progressly"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </motion.div>
        </motion.div>

        {/* Brand Name */}
        <motion.h1
          className="text-2xl font-bold bg-gradient-to-r from-accent via-yellow-400 to-accent bg-clip-text text-transparent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Progressly
        </motion.h1>

        {/* Motivational Quote */}
        <motion.p
          className="text-gray-300 text-center text-sm italic leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          "{quote}"
        </motion.p>

        {/* Progress Bar */}
        <motion.div
          className="w-48 h-1 bg-white/10 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-accent to-blue-500 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ 
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Animated Dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-accent/50"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
