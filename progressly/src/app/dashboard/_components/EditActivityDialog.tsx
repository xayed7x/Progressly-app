"use client";

import { useState, useEffect } from "react";
import { ActivityReadWithCategory, Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@clerk/nextjs";
import { updateActivity } from "@/lib/apiClient";
import { useCategories } from "@/hooks/useCategories";

interface EditActivityDialogProps {
  activity: ActivityReadWithCategory;
  isOpen: boolean;
  onClose: () => void;
  onActivityUpdated: () => void;
}

export function EditActivityDialog({
  activity,
  isOpen,
  onClose,
  onActivityUpdated,
}: EditActivityDialogProps) {
  const { getToken } = useAuth();
  const { data: categories } = useCategories();
  
  // Form state - initialize with activity data
  const [activityName, setActivityName] = useState(activity.activity_name);
  const [startTime, setStartTime] = useState(activity.start_time);
  const [endTime, setEndTime] = useState(activity.end_time);
  const [categoryId, setCategoryId] = useState(activity.category_id?.toString() || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when activity changes
  useEffect(() => {
    setActivityName(activity.activity_name);
    setStartTime(activity.start_time);
    setEndTime(activity.end_time);
    setCategoryId(activity.category_id?.toString() || "");
  }, [activity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activityName.trim() || !startTime || !endTime || !categoryId) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = await getToken();
      if (!token) throw new Error("No authentication token");

      await updateActivity(Number(activity.id), {
        activity_name: activityName.trim(),
        start_time: startTime,
        end_time: endTime,
        category_id: parseInt(categoryId),
      }, token);

      onActivityUpdated(); // Trigger SWR refresh
      onClose();
    } catch (error) {
      console.error("Failed to update activity:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-secondary text-textDark border border-border">
        <DialogHeader>
          <DialogTitle>Edit Activity</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity-name">Activity Name</Label>
            <Input
              id="activity-name"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="What did you do?"
              className="bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="bg-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
