import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Define a type for our Activity object to ensure type safety
type Activity = {
  id: number;
  activity_name: string;
  start_time: string; // e.g., "14:30:00"
  end_time: string;
  user_id: string;
  activity_date: string;
  category: string;
};

type ActivityListProps = {
  activities: Activity[];
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getShortCategoryName = (category: string) => {
  return category.split(/[-\s/]/)[0]; // Returns only the first word, splitting by space, hyphen or slash
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

export default function ActivityList({ activities }: ActivityListProps) {
  // We don't need a special empty state here, as this component
  // will only be rendered if there are activities.
  if (activities.length === 0) {
    return null;
  }

  // Create chronological order (morning to night)
  const chronologicalActivities = [...activities].reverse();

  return (
    <TooltipProvider>
      <div className="w-full max-w-lg space-y-4">
        <h2 className="text-xl font-semibold text-secondary text-center">
          Today's Log
        </h2>
        <div className="space-y-3">
          {chronologicalActivities.map((activity) => (
            <Card
              key={activity.id}
              className="mb-4 bg-secondary/90 text-textDark"
            >
              <CardContent className="grid grid-cols-[1fr_90px_auto] items-center gap-4 p-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="font-semibold text-textDark truncate">
                      {activity.activity_name}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{activity.activity_name}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      className={`${
                        categoryStyles[activity.category] ||
                        categoryStyles.Other
                      } max-w-[80px] truncate flex justify-center items-center text-center`}
                    >
                      {getShortCategoryName(activity.category)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{activity.category}</p>
                  </TooltipContent>
                </Tooltip>
                <div className="flex items-center gap-2 text-xs text-textLight font-mono">
                  <Clock size={12} />
                  <span>
                    {activity.start_time.slice(0, 5)} -{" "}
                    {activity.end_time.slice(0, 5)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
