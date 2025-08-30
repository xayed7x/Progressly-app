"use client";

import { TypeAnimation } from "react-type-animation";
import { Input } from "@/components/ui/input";
import React from "react";

// A curated list of concise, inspiring activities for an "Achiever"
const activityPlaceholders = [
  "Morning prayer & meditation",
  1500,
  "Intense cardio session",
  1500,
  "Read 'Atomic Habits' chapter 5",
  1500,
  "Deep work on Q3 financial model",
  2000,
  "Review and reply to priority emails",
  1500,
  "Lunch with the marketing team",
  1500,
  "Practice Spanish on Duolingo",
  1500,
  "Plan tomorrow's top 3 priorities",
  2000,
  "Family dinner (no phones)",
  1500,
  "Evening journaling and reflection",
  2000,
];

interface AnimatedPlaceholderInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string; // Make name optional as it's passed from parent
}

const AnimatedPlaceholderInput = React.forwardRef<
  HTMLInputElement,
  AnimatedPlaceholderInputProps
>(({ value, onChange, name }, ref) => {
  return (
    <div className="relative w-full">
      {/* The actual, functional input field */}
      <Input
        id="activity-name"
        name={name}
        value={value}
        onChange={onChange}
        className="bg-white placeholder:text-transparent" // Hide the default placeholder
        required
        ref={ref}
      />
      {/* The animation, positioned absolutely on top of the input */}
      {!value && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center px-3 pointer-events-none">
          <TypeAnimation
            sequence={activityPlaceholders}
            wrapper="span"
            cursor={true}
            repeat={Infinity}
            className="text-textLight/70" // Style the animated text to look like a placeholder
          />
        </div>
      )}
    </div>
  );
});

AnimatedPlaceholderInput.displayName = "AnimatedPlaceholderInput";

export default AnimatedPlaceholderInput;
