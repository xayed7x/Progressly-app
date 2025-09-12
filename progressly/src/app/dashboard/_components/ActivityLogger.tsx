"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logActivity } from "@/app/dashboard/activity-actions";
import { useRef, useState } from "react";
import { Category } from "@/lib/types";
import CategorySelect from "./CategorySelect";
import SubmitButton from "./SubmitButton";
import AnimatedPlaceholderInput from "./AnimatedPlaceholderInput";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { db, QueuedActivity } from "@/lib/db";

export default function ActivityLogger({
  lastEndTime,
  categories,
  onActivityLogged,
  addOptimisticActivity,
}: {
  lastEndTime?: string;
  categories: Category[];
  onActivityLogged: () => void;
  addOptimisticActivity: (activity: any) => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [activityName, setActivityName] = useState("");
  const isOnline = useOnlineStatus();

  const handleFormSubmit = async (formData: FormData) => {
    try {
      if (isOnline) {
        // Online: Send to backend API
        const result = await logActivity(formData);
        if (result.success) {
          setActivityName(""); // Clear the activity name input
          onActivityLogged(); // Revalidate the activities list
        } else {
          // Handle error display
          alert(result.error);
        }
      } else {
        // Offline: Save to IndexedDB
        const queuedActivity: QueuedActivity = {
          activity_name: formData.get("activity_name") as string,
          start_time: formData.get("start_time") as string,
          end_time: formData.get("end_time") as string,
          category_id: formData.get("category_id") ? Number(formData.get("category_id")) : null,
        };

        await db.queued_activities.add(queuedActivity);

        // After successfully queueing, register a background sync.
        if (navigator.serviceWorker && "SyncManager" in window) {
          const sw = await navigator.serviceWorker.ready;
          await sw.sync.register("sync-queued-activities");
        }
        
        // Create optimistic activity object for immediate UI display
        const optimisticActivity = {
          id: Date.now(), // Temporary ID
          activity_name: queuedActivity.activity_name,
          start_time: queuedActivity.start_time,
          end_time: queuedActivity.end_time,
          activity_date: new Date().toISOString(),
          category_id: queuedActivity.category_id,
          category: queuedActivity.category_id 
            ? categories.find(cat => cat.id.toString() === queuedActivity.category_id!.toString()) || null
            : null,
          isPendingSync: true, // Mark as pending sync
        };

        addOptimisticActivity(optimisticActivity);
        setActivityName(""); // Clear the activity name input
        // Note: We don't call onActivityLogged() here since the data is only queued locally
      }
    } catch (error) {
      console.error("Error submitting activity:", error);
      alert("Failed to save activity. Please try again.");
    }
  };

  return (
    <form
      ref={formRef}
      action={handleFormSubmit}
    >
      <Card className="bg-secondary text-textDark w-full max-w-lg">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">
            Log Your Activity
          </CardTitle>
          <CardDescription>What have you accomplished?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="activity-name">Activity Name</Label>
            <AnimatedPlaceholderInput
              name="activity_name"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                name="start_time"
                type="time"
                className="bg-white"
                defaultValue={lastEndTime}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                name="end_time"
                type="time"
                className="bg-white"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <CategorySelect name="category_id" categories={categories} />
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton pendingText="Logging...">Log Activity</SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}
