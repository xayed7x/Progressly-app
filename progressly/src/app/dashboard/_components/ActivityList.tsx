import ActivityCard from "./ActivityCard";
import type { ActivityReadWithCategory } from "@/lib/types";

type ActivityListProps = {
  activities: ActivityReadWithCategory[];
};

export default function ActivityList({ activities }: ActivityListProps) {
  if (!activities || activities.length === 0) {
    return null;
  }

  // Create chronological order (morning to night)
  const chronologicalActivities = [...activities].reverse();

  return (
    <div className="w-full max-w-lg">
      {/* The list of activity cards */}
      <div className="relative space-y-4">
        {/* The vertical timeline line */}
        <div className="absolute left-6 top-0 h-full w-0.5 bg-muted" />

        {chronologicalActivities.map((activity, index) => (
          <ActivityCard key={activity.id} activity={activity} index={index} />
        ))}
      </div>
    </div>
  );
}


