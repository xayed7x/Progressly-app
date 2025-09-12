"use client";

import { useState } from "react";
import { ActivityReadWithCategory } from "@/lib/types";
import ActivityList from "./ActivityList";
import ActivityListSkeleton from "./ActivityListSkeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface ActivitiesWrapperProps {
  activities: ActivityReadWithCategory[] | undefined;
  optimisticActivities: ActivityReadWithCategory[];
  isLoading: boolean;
  selectedDate: Date;
  onActivityUpdated: () => void;
}

export function ActivitiesWrapper({
  activities,
  optimisticActivities,
  isLoading,
  selectedDate,
  onActivityUpdated,
}: ActivitiesWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) return <ActivityListSkeleton />;

  // CRITICAL FIX: Don't filter by activity_date since backend now handles wake-up to wake-up logic
  // The backend already returns the correct activities for the selected date's wake-up cycle
  const apiActivities = activities || [];
  
  // Merge API activities with optimistic activities
  const allActivities = [...optimisticActivities, ...apiActivities];

  // Sort activities in reverse chronological order (newest first)
  const sortedActivities = [...allActivities].sort((a, b) => {
    // Create full, comparable timestamps for each activity
    const timestamp_a = new Date(a.activity_date.split('T')[0] + 'T' + a.start_time);
    const timestamp_b = new Date(b.activity_date.split('T')[0] + 'T' + b.start_time);
    
    // Sort in descending order (newest first)
    return timestamp_b.getTime() - timestamp_a.getTime();
  });

  const getLogTitle = (date: Date) => {
    if (isToday(date)) return "Today's Log";
    if (isYesterday(date)) return "Yesterday's Log";
    return `${format(date, "EEEE")}'s Log`;
  };

  if (sortedActivities.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold mb-2 text-white">{getLogTitle(selectedDate)}</h2>
        <p className="text-muted-foreground">
          No activities logged for {isToday(selectedDate) ? "today" : format(selectedDate, "EEEE")}.
        </p>
      </div>
    );
  }

  // Create visibleActivities (first 5) and hiddenActivities (rest)
  const visibleActivities = sortedActivities.slice(0, 5);
  const hiddenActivities = sortedActivities.slice(5);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-center text-white">{getLogTitle(selectedDate)}</h2>
      <ActivityList activities={visibleActivities} onActivityUpdated={onActivityUpdated} />

      {hiddenActivities.length > 0 && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          <CollapsibleContent className="space-y-2">
            <ActivityList activities={hiddenActivities} onActivityUpdated={onActivityUpdated} />
          </CollapsibleContent>
          <CollapsibleTrigger asChild>
            <Button className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
              {isOpen ? "Show Less" : `Show ${hiddenActivities.length} More`}
              <ChevronsUpDown className="h-4 w-4 ml-2" />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      )}
    </div>
  );
}
