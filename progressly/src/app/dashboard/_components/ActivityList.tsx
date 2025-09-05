import ActivityCard from "./ActivityCard"; // Import the new component

// Define a type for our Activity object
type Activity = {
  id: number;
  activity_name: string;
  start_time: string;
  end_time: string;
  user_id: string;
  activity_date: string;
  category: string;
};

type ActivityListProps = {
  activities: Activity[];
};

export default function ActivityList({ activities }: ActivityListProps) {
  if (activities.length === 0) {
    return null;
  }

  // Create chronological order (morning to night)
  const chronologicalActivities = [...activities].reverse();

  return (
    <div className="w-full max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-secondary text-center">
        Today's Log
      </h2>
      <div className="space-y-3">
        {chronologicalActivities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}