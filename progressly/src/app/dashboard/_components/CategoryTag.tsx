"use client";

import { CATEGORY_CONFIG } from "@/lib/category-config";
import { type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the props the component will accept
interface CategoryTagProps {
  categoryName: string | undefined; // Accept undefined for safety
  className?: string; // Allow passing additional classes for custom styling
}

export function CategoryTag({ categoryName, className }: CategoryTagProps) {
  // 1. Determine the configuration to use.
  //    - If a categoryName is provided and exists in our config, use it.
  //    - Otherwise, fall back to the 'Default' configuration.
  const config =
    categoryName && categoryName in CATEGORY_CONFIG
      ? CATEGORY_CONFIG[categoryName as keyof typeof CATEGORY_CONFIG]
      : CATEGORY_CONFIG["Default"];

  // 2. Assign the Icon component from the config to a variable.
  //    This is a standard pattern for rendering a component dynamically.
  const Icon = config.icon;

  return (
    // 3. Render the pill-shaped tag.
    <div
      className={cn(
        "flex items-center gap-x-2 rounded-full px-3 py-1 text-xs font-medium text-white",
        config.color, // Apply the background color from the config
        className // Apply any extra classes passed in via props
      )}
    >
      {/* 4. Render the icon with standard sizing and styling. */}
      <Icon className="h-3 w-3" />

      {/* 5. Render the category name, falling back to "Other" if none is provided. */}
      <span className="truncate">{categoryName || "Other"}</span>
    </div>
  );
}