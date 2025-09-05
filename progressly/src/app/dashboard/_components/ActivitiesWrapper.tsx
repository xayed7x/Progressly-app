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
  isLoading: boolean;
  selectedDate: Date;
}

export function ActivitiesWrapper({
  activities,
  isLoading,
  selectedDate,
}: ActivitiesWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) return <ActivityListSkeleton />;

  // Filter activities for the selected date
  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const filteredActivities = activities?.filter(activity => {
    const activityDateStr = format(new Date(activity.activity_date), "yyyy-MM-dd");
    return activityDateStr === selectedDateStr;
  }) || [];

  const getLogTitle = (date: Date) => {
    if (isToday(date)) return "Today's Log";
    if (isYesterday(date)) return "Yesterday's Log";
    return `${format(date, "EEEE")}'s Log`;
  };

  if (filteredActivities.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-semibold mb-2 text-white">{getLogTitle(selectedDate)}</h2>
        <p className="text-muted-foreground">
          No activities logged for {isToday(selectedDate) ? "today" : format(selectedDate, "EEEE")}.
        </p>
      </div>
    );
  }

  const initialActivities = filteredActivities.slice(0, 5);
  const collapsibleActivities = filteredActivities.slice(5);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-center text-white">{getLogTitle(selectedDate)}</h2>
      <ActivityList activities={initialActivities} />

      {collapsibleActivities.length > 0 && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          <CollapsibleContent className="space-y-2">
            <ActivityList activities={collapsibleActivities} />
          </CollapsibleContent>
          <CollapsibleTrigger asChild>
            <Button className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
              {isOpen ? "Show Less" : `Show ${collapsibleActivities.length} More`}
              <ChevronsUpDown className="h-4 w-4 ml-2" />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      )}
    </div>
  );
}
