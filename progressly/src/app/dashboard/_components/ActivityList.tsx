import ActivityCard from "./ActivityCard";
import type { ActivityReadWithCategory } from "@/lib/types";

type ActivityListProps = {
  activities: ActivityReadWithCategory[];
  onActivityUpdated: () => void;
};

export default function ActivityList({ activities, onActivityUpdated }: ActivityListProps) {
  if (!activities || activities.length === 0) {
    return null;
  }

  // Activities are already sorted by the parent component.
  const chronologicalActivities = activities;

  return (
    <div className="w-full max-w-lg">
      {/* The list of activity cards */}
      <div className="relative space-y-4">
        {/* The vertical timeline line */}
        <div className="absolute left-6 top-0 h-full w-0.5 bg-muted" />

        {chronologicalActivities.map((activity, index) => (
          <ActivityCard 
            key={activity.id} 
            activity={activity} 
            index={index} 
            onActivityUpdated={onActivityUpdated}
            isPendingSync={(activity as any).isPendingSync || false}
          />
        ))}
      </div>
    </div>
  );
}