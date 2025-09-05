"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Clock, ChevronDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Type definitions (can be moved to a shared types file later)
type Activity = {
  id: number;
  activity_name: string;
  start_time: string;
  end_time: string;
  category: string;
};

const getShortCategoryName = (category: string) => {
  return category.split(/[-\s/]/)[0];
};

const categoryStyles: { [key: string]: string } = {
  Work: "border-blue-500/50 bg-blue-500/10 text-blue-700",
  Study: "border-green-500/50 bg-green-500/10 text-green-700",
  "Health & Fitness": "border-red-500/50 bg-red-500/10 text-red-700",
  "Family & Social": "border-yellow-500/50 bg-yellow-500/10 text-yellow-700",
  Sleep: "border-indigo-500/50 bg-indigo-500/10 text-indigo-700",
  "Personal Time": "border-purple-500/50 bg-purple-500/10 text-purple-700",
  "Faith/Discipline": "border-orange-500/50 bg-orange-500/10 text-orange-700",
  Other: "border-gray-500/50 bg-gray-500/10 text-gray-700",
};

export default function ActivityCard({ activity }: { activity: Activity }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-secondary/90 text-textDark">
        <CollapsibleTrigger asChild>
          <div className="grid grid-cols-[auto_1fr_90px_auto] items-center gap-4 p-3 cursor-pointer">
            {/* Expand/Collapse Chevron Icon */}
            <ChevronDown
              size={16}
              className={`text-textLight transition-transform duration-300 ${
                isOpen ? "rotate-180" : ""
              }`}
            />

            {/* Truncated Activity Name */}
            <p className="font-semibold text-textDark truncate">
              {activity.activity_name}
            </p>

            {/* Category Badge with Tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    className={`${
                      categoryStyles[activity.category] || categoryStyles.Other
                    } max-w-[80px] truncate flex justify-center items-center text-center`}
                  >
                    {getShortCategoryName(activity.category)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{activity.category}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Time */}
            <div className="flex items-center gap-2 text-xs text-textLight font-mono">
              <Clock size={12} />
              <span>
                {activity.start_time.slice(0, 5)} -{" "}
                {activity.end_time.slice(0, 5)}
              </span>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Collapsible Content Area */}
        <CollapsibleContent className="px-3 pb-3 pl-12">
          <p className="text-textDark/80 text-sm whitespace-normal">
            {activity.activity_name}
          </p>
          {/* This is where you can add more details in the future, like notes */}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
