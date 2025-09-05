import { ActivityReadWithCategory } from "@/lib/types";
import { format, parse } from "date-fns";
import { Badge } from "@/components/ui/badge"; // We are bringing the Badge back!

// A predefined, tasteful color palette for the card backgrounds.
const cardColorPalette = [
  "#2D3748", // Slate Gray
  "#4A5568", // Darker Gray
  "#2B6CB0", // Cool Blue
  "#2C5282", // Darker Blue
  "#38A169", // Muted Green
];

const formatTime = (timeStr: string | undefined) => {
  if (!timeStr) return "N/A";
  try {
    const time = parse(timeStr, "HH:mm:ss", new Date());
    return format(time, "h:mm a");
  } catch (error) {
    console.error("Invalid time format passed to formatTime:", timeStr);
    return "Invalid Time";
  }
};

export default function ActivityCard({
  activity,
  index, // We now accept an 'index' to calculate the background color
}: {
  activity: ActivityReadWithCategory;
  index: number;
}) {
  // --- COLOR LOGIC ---
  // The card background cycles through our predefined palette.
  const cardBackgroundColor = cardColorPalette[index % cardColorPalette.length];
  // The timeline dot and category badge use the actual color from the database.
  const categoryColor = activity.category?.color || "#A0AEC0"; // Fallback to a light gray

  return (
    // Root container for timeline structure
    <div className="relative">
      

      {/* 2. The Main Card: Now uses the shuffling background color. */}
      <div
        className="p-4 rounded-lg text-white"
        style={{ backgroundColor: cardBackgroundColor }}
      >
        {/* 3. The New 3-Tier Layout */}
        <div className="flex flex-col gap-2">
          {/* Tier 1: Activity Name (Prominent) */}
          <span className="font-semibold truncate text-base">
            {activity.activity_name}
          </span>

          {/* Tier 2 & 3: Time Span and Category Badge on one line */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/70">
              {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
            </span>
            <Badge
              style={{ backgroundColor: categoryColor, color: "#FFFFFF" }}
              className="max-w-[150px] truncate"
            >
              {activity.category?.name || "Other"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
