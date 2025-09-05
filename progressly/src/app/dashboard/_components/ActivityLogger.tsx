"use client";

import { Button } from "@/components/ui/button";
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
import { logActivity } from "@/app/dashboard/activity-actions"; // 1. Import the action
import { useRef, useState } from "react";
import { Category } from "@/lib/types";
import CategorySelect from "./CategorySelect";
import SubmitButton from "./SubmitButton";
import AnimatedPlaceholderInput from "./AnimatedPlaceholderInput";

export default function ActivityLogger({
  lastEndTime,
  categories,
}: {
  lastEndTime?: string;
  categories: Category[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [activityName, setActivityName] = useState("");

  return (
    // 2. Wrap in a form and connect the action
    <form
      ref={formRef}
      action={async (formData) => {
        const result = await logActivity(formData);
        if (result.success) {
          setActivityName(""); // Clear the activity name input
          // formRef.current?.reset(); // This is no longer needed for activityName
        } else {
          // Optional: Handle error display
          alert(result.error);
        }
      }}
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
                name="start_time" // Add name attribute
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
                name="end_time" // Add name attribute
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
