import { auth } from "@clerk/nextjs/server";
import ActivityList from "./ActivityList";
import type { Activity } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// --- Data Fetching Function ---
async function getActivities(): Promise<Activity[]> {
  const { getToken } = await auth();
  const token = await getToken({ template: "fastapi" });
  if (!token) return [];

  try {
    const res = await fetch(`${API_BASE_URL}/api/activities`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.error("Failed to fetch activities:", e);
    return [];
  }
}

// --- Wrapper Component ---
export default async function ActivitiesWrapper() {
  // 1. Fetch the data inside this component
  const activities = await getActivities();

  // 2. Sort the data
  const sortedActivities = [...activities].sort((a, b) =>
    b.start_time.localeCompare(a.start_time)
  );

  // 3. Render the final list
  return <ActivityList activities={sortedActivities} />;
}
