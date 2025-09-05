import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";
import ActivityLogger from "./_components/ActivityLogger";
import GoalManager from "./_components/GoalManager";
import ActivityListSkeleton from "./_components/ActivityListSkeleton";
import ActivitiesWrapper from "./_components/ActivitiesWrapper";

// This page component is now simpler and more focused on layout.
export default async function DashboardPage() {
  const user = await currentUser();

  // We need to get the latest activity's end time for the ActivityLogger.
  // We will fetch it separately so it doesn't block the initial page load.
  // NOTE: For a future optimization, we could create a dedicated endpoint for just this piece of data.
  // For now, we are creating a separate wrapper for it.
  const activitiesForLogger = await getLatestActivityEndTime();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center gap-y-8">
        <h1 className="text-center text-3xl font-bold text-secondary">
          Welcome back, {user?.firstName || "Achiever"}!
        </h1>

        <ActivityLogger lastEndTime={activitiesForLogger?.end_time} />

        <div className="w-full max-w-lg bg-secondary/40 p-4 rounded-lg">
          <Suspense fallback={<ActivityListSkeleton />}>
            <ActivitiesWrapper />
          </Suspense>
        </div>

        <div className="mt-8">
          <GoalManager />
        </div>
      </div>
    </main>
  );
}

// Helper function to get the latest activity end time without fetching the whole list here
// This is an interim step. A dedicated API endpoint would be the ideal long-term solution.
import { auth } from "@clerk/nextjs/server";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

type Activity = {
  id: number;
  activity_name: string;
  start_time: string;
  end_time: string;
  user_id: string;
  activity_date: string;
  category: string;
};

async function getLatestActivityEndTime(): Promise<Activity | null> {
  const { getToken } = await auth();
  const token = await getToken({ template: "fastapi" });
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/activities/latest`, {
      // Assuming you create this endpoint
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    // If the endpoint returns an empty object for no activity, handle it
    if (Object.keys(data).length === 0) {
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}
