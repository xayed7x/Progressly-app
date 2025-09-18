import { ActivityReadWithCategory } from "@/lib/types";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Pencil, CloudOff } from "lucide-react";
import { useState } from "react";
import { EditActivityDialog } from "./EditActivityDialog";
import { CategoryTag } from "./CategoryTag";

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
  onActivityUpdated, // SWR mutate function for instant UI refresh
  isPendingSync = false, // New prop for offline activities
  index, // Add index to props
}: {
  activity: ActivityReadWithCategory;
  onActivityUpdated: () => void;
  isPendingSync?: boolean;
  index?: number; // Add index to props interface
}) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <div className="relative">
      <div className="p-4 rounded-lg text-primary bg-secondary/90">
        <div className="flex flex-col gap-3">
          {/* Tier 1: Main Info (Name and Time) */}
          <div className="flex flex-col">
            <span className="font-semibold truncate text-base">
              {activity.activity_name}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-primary/70">
                {formatTime(activity.start_time)} -{" "}
                {formatTime(activity.end_time)}
              </span>
              {isPendingSync && (
                <div title="Pending sync">
                  <CloudOff className="h-4 w-4 text-orange-400" />
                </div>
              )}
            </div>
          </div>

          {/* Tier 2: Footer (Category and Actions) */}
          <div className="flex justify-between items-center pt-2">
            <CategoryTag categoryName={activity.category?.name} />
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-primary/70 hover:text-primary hover:bg-black/10"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
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