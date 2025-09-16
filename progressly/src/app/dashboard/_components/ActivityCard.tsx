import { ActivityReadWithCategory } from "@/lib/types";
import { format, parse } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, CloudOff } from "lucide-react";
import { useState } from "react";
import { EditActivityDialog } from "./EditActivityDialog";

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
  onActivityUpdated, // SWR mutate function for instant UI refresh
  isPendingSync = false, // New prop for offline activities
}: {
  activity: ActivityReadWithCategory;
  index: number;
  onActivityUpdated: () => void;
  isPendingSync?: boolean;
}) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">
                {formatTime(activity.start_time)} - {formatTime(activity.end_time)}
              </span>
              {isPendingSync && (
                <div title="Pending sync">
                  <CloudOff className="h-4 w-4 text-orange-400" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                style={{ backgroundColor: categoryColor, color: "#FFFFFF" }}
                className="max-w-[120px] truncate"
              >
                {activity.category?.name || "Other"}
              </Badge>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-white/70 hover:text-white hover:bg-white/10"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <EditActivityDialog
        activity={activity}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onActivityUpdated={onActivityUpdated}
      />
    </div>
  );
}