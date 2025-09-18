import {
  Laptop, // Work
  BookOpen, // Study
  MoonStar, // Spiritual & Faith
  Utensils, // Eating & Nutrition
  Sprout, // Skill Development
  Smartphone, // Social Media
  Users, // Family & Social
  Dumbbell, // Health & Fitness
  User, // Personal Time
  Bed, // Sleep
  Car, // Transportation
  Home, // Home & Chores
  Gamepad2, // Leisure & Hobbies
  Star, // Default
} from "lucide-react";

export const CATEGORY_CONFIG = {
  "Work": { icon: Laptop, color: "bg-blue-500" },
  "Study": { icon: BookOpen, color: "bg-green-500" },
  "Spiritual & Faith": { icon: MoonStar, color: "bg-amber-500" },
  "Eating & Nutrition": { icon: Utensils, color: "bg-orange-500" },
  "Skill Development": { icon: Sprout, color: "bg-teal-500" },
  "Social Media": { icon: Smartphone, color: "bg-pink-500" },
  "Family & Social": { icon: Users, color: "bg-yellow-500" },
  "Health & Fitness": { icon: Dumbbell, color: "bg-red-500" },
  "Personal Time": { icon: User, color: "bg-purple-500" },
  "Sleep": { icon: Bed, color: "bg-indigo-500" },
  "Transportation": { icon: Car, color: "bg-slate-500" },
  "Home & Chores": { icon: Home, color: "bg-stone-500" },
  "Leisure & Hobbies": { icon: Gamepad2, color: "bg-cyan-500" },
  "Default": { icon: Star, color: "bg-gray-500" }, // A fallback for custom categories
};