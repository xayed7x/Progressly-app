"use client";

import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Moon, Sun, Lock } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { useState } from "react";

interface DaySelectorProps {
  selectedDate: Date;
  onPreviousClick: () => void;
  onNextClick: () => void;
  onEndDay?: () => void;
  isPreviousDisabled: boolean;
  isNextDisabled: boolean;
  isDayEnded?: boolean;  // NEW: Track if day has already been ended
}

export function DaySelector({ 
  selectedDate, 
  onPreviousClick, 
  onNextClick, 
  onEndDay,
  isPreviousDisabled, 
  isNextDisabled,
  isDayEnded = false  // Default to false
}: DaySelectorProps) {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const getDayLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return "Day Before";
  };

  const getDayDescription = (date: Date) => {
    return format(date, "EEEE, MMM d");
  };

  // Show End Day button only when viewing past days (not today) AND day not yet ended
  const showEndDayButton = !isToday(selectedDate);
  
  // Check if we're in a late-night session (after midnight, viewing yesterday)
  const currentHour = new Date().getHours();
  const isLateNightSession = !isToday(selectedDate) && currentHour < 6;

  const handleEndDay = () => {
    if (onEndDay && !isDayEnded) {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 4000);
      onEndDay();
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Late night session indicator */}
      {isLateNightSession && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-full text-sm">
          <Moon className="h-3 w-3" />
          <span>Late night session - still logging to {getDayDescription(selectedDate)}</span>
        </div>
      )}

      {/* Success message after ending day */}
      {showSuccessMessage && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm animate-in fade-in slide-in-from-top-2">
          <Sun className="h-4 w-4" />
          <span>☀️ Great job! Your {getDayDescription(selectedDate)} session has ended.</span>
        </div>
      )}

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

      {showEndDayButton && onEndDay && (
        <Button
          size="sm"
          onClick={handleEndDay}
          disabled={isDayEnded}
          className={`flex items-center gap-2 font-semibold transition-colors ${
            isDayEnded 
              ? 'bg-muted text-muted-foreground cursor-not-allowed' 
              : 'bg-accent text-black hover:bg-accent/90'
          }`}
        >
          {isDayEnded ? (
            <>
              <Lock className="h-4 w-4" />
              Day Ended
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              End My Day
            </>
          )}
        </Button>
      )}
    </div>
  );
}
