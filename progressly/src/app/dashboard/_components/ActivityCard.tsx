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

import { categoryStyles } from "@/lib/constants";
import type { Activity } from "@/lib/types";

const getShortCategoryName = (name: string) => {
  return name.split(/[-\s/]/)[0];
};

export default function ActivityCard({ activity }: { activity: Activity }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-secondary/90 text-textDark">
        <CollapsibleTrigger asChild>
          <div className="grid grid-cols-[1fr_90px_auto_auto] items-center gap-4 p-3 cursor-pointer">
            {/* Truncated Activity Name */}
            <p className="font-semibold text-textDark truncate">
              {activity.activity_name}
            </p>

            {/* Category Badge with Tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    style={{ backgroundColor: activity.category?.color || undefined }}
                    className={`max-w-[80px] truncate flex justify-center items-center text-center`}
                  >
                    {getShortCategoryName(activity.category?.name || "Other")}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{activity.category?.name || "Other"}</p>
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

            {/* Expand/Collapse Chevron Icon */}
            <ChevronDown
              size={16}
              className={`text-textLight transition-transform duration-300 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
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
