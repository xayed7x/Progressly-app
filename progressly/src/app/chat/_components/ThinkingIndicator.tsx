'use client';

import { motion } from 'framer-motion';

export function ThinkingIndicator() {
  return (
    <div className="flex items-start">
      <div className="p-4 rounded-xl bg-primary border border-transparent rounded-bl-sm">
        <div className="flex items-center gap-2">
          <span className="text-secondary text-sm">Progresso is thinking</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-accent rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
