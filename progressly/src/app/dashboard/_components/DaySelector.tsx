"use client";

import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isToday, isYesterday, subDays } from "date-fns";

interface DaySelectorProps {
  selectedDate: Date;
  onPreviousClick: () => void;
  onNextClick: () => void;
  isPreviousDisabled: boolean;
  isNextDisabled: boolean;
}

export function DaySelector({ 
  selectedDate, 
  onPreviousClick, 
  onNextClick, 
  isPreviousDisabled, 
  isNextDisabled 
}: DaySelectorProps) {
  const getDayLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return "Day Before";
  };

  const getDayDescription = (date: Date) => {
    return format(date, "EEEE, MMM d");
  };

  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-secondary/20 rounded-lg">
      <Button
        variant="outline"
        size="sm"
        onClick={onPreviousClick}
        disabled={isPreviousDisabled}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-lg">{getDayLabel(selectedDate)}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {getDayDescription(selectedDate)}
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onNextClick}
        disabled={isNextDisabled}
        className="flex items-center gap-2"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
