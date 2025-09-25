import { ActivityReadWithCategory } from "@/lib/types";
import { format, parse } from "date-fns";
import { Button } from "@/components/ui/button";
import { Pencil, CloudOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { EditActivityDialog } from "./EditActivityDialog";
import { CategoryTag } from "./CategoryTag";
import { deleteActivity } from "@/app/dashboard/activity-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

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
  const [isConfirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteActivity(activity.id);
      onActivityUpdated(); // Trigger SWR mutation to refresh the list
    } catch (error) {
      console.error("Failed to delete activity", error);
      // Optionally, show an error toast to the user
    } finally {
      setConfirmDeleteDialogOpen(false);
      setIsDeleting(false);
    }
  };

  return (
    <>
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
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-primary/70 hover:text-primary hover:bg-black/10"
                  onClick={() => setIsEditDialogOpen(true)}
                  disabled={isDeleting}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-500/60 hover:text-red-500 hover:bg-red-500/10"
                  onClick={() => setConfirmDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <EditActivityDialog
        activity={activity}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onActivityUpdated={onActivityUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isConfirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-secondary text-textDark border border-border">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the activity
              <span className="font-semibold text-primary/90"> {activity.activity_name}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="h-4 w-4 border-2 border-t-transparent border-current rounded-full animate-spin" />
              ) : (
                "Confirm Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}