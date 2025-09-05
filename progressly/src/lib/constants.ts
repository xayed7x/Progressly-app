// src/lib/constants.ts

export const defaultActivityCategories = [
  "Work",
  "Study",
  "Skill Development",
  "Spiritual & Faith",
  "Health & Fitness",
  "Personal Time",
  "Family & Social",
  "Social Media",
  "Leisure & Hobbies",
  "Eating & Nutrition",
  "Transportation",
  "Home & Chores",
  "Sleep",
];

export const categoryStyles: { [key: string]: string } = {
  Work: "border-blue-500/50 bg-blue-500/10 text-blue-700",
  Study: "border-green-500/50 bg-green-500/10 text-green-700",
  "Skill Development": "border-teal-500/50 bg-teal-500/10 text-teal-700",
  "Spiritual & Faith": "border-amber-500/50 bg-amber-500/10 text-amber-700",
  "Health & Fitness": "border-red-500/50 bg-red-500/10 text-red-700",
  "Personal Time": "border-purple-500/50 bg-purple-500/10 text-purple-700",
  "Family & Social": "border-yellow-500/50 bg-yellow-500/10 text-yellow-700",
  "Social Media": "border-pink-500/50 bg-pink-500/10 text-pink-700",
  "Leisure & Hobbies": "border-cyan-500/50 bg-cyan-500/10 text-cyan-700",
  "Eating & Nutrition": "border-orange-500/50 bg-orange-500/10 text-orange-700",
  Transportation: "border-slate-500/50 bg-slate-500/10 text-slate-700",
  "Home & Chores": "border-stone-500/50 bg-stone-500/10 text-stone-700",
  Sleep: "border-indigo-500/50 bg-indigo-500/10 text-indigo-700",
  Other: "border-gray-500/50 bg-gray-500/10 text-gray-700",
};

// Hex colors to use when creating preset categories on-the-fly
export const defaultCategoryHexColors: { [key: string]: string } = {
  Work: "#3b82f6",
  Study: "#22c55e",
  "Skill Development": "#14b8a6",
  "Spiritual & Faith": "#f59e0b",
  "Health & Fitness": "#ef4444",
  "Personal Time": "#8b5cf6",
  "Family & Social": "#eab308",
  "Social Media": "#ec4899",
  "Leisure & Hobbies": "#06b6d4",
  "Eating & Nutrition": "#f97316",
  Transportation: "#64748b",
  "Home & Chores": "#78716c",
  Sleep: "#4f46e5",
};