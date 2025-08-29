import { auth, currentUser } from "@clerk/nextjs/server";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
import { revalidatePath } from "next/cache";
import ActivityLogger from "./_components/ActivityLogger";
import ActivityList from "./_components/ActivityList"; // 1. Import ActivityList
import GoalManager from "./_components/GoalManager";

// --- Type Definitions ---
type Goal = { id: number; user_id: string; content: string; created_at: string };
type Activity = { id: number; activity_name: string; start_time: string; end_time: string; user_id: string; activity_date: string; category: string; };

// --- Data Fetching Functions ---

// 2. New function to fetch activities
async function getActivities(): Promise<Activity[]> {
  const { getToken } = await auth();
  const token = await getToken({ template: "fastapi" });
  if (!token) return [];
  try {
    const res = await fetch(`${API_BASE_URL}/api/activities`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch (e) { return []; }
}

async function logActivity(formData: FormData) {
  "use server";
  // (This function remains unchanged)
  const { getToken } = await auth();
  const token = await getToken({ template: "fastapi" });
  if (!token) return { success: false, error: "User not authenticated." };
  const activityData = {
    activity_name: formData.get("activity_name") as string,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
  };
  if (!activityData.activity_name || !activityData.start_time || !activityData.end_time) {
    return { success: false, error: "All fields are required." };
  }
  try {
    const res = await fetch(`${API_BASE_URL}/api/activities`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(activityData) });
    if (!res.ok) return { success: false, error: "Failed to log activity" };
    revalidatePath("/dashboard");
    return { success: true, data: await res.json() };
  } catch (e) { return { success: false, error: "An unexpected error occurred." }; }
}

// --- Main Dashboard Page Component ---
export default async function DashboardPage() {
  // 3. Fetch all data concurrently
  const userFetch = currentUser();
  const activitiesFetch = getActivities();

  const [user, activities] = await Promise.all([userFetch, activitiesFetch]);

  // Sort activities by start_time in descending order (most recent first)
  const sortedActivities = activities.sort((a, b) => b.start_time.localeCompare(a.start_time));
  const latestActivity = sortedActivities[0];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center gap-y-8">
        <h1 className="text-center text-3xl font-bold text-secondary">
          Welcome back, {user?.firstName || "Achiever"}!
        </h1>

        <ActivityLogger lastEndTime={latestActivity?.end_time} />
        
        {/* 4. Render the ActivityList with the fetched data */}
        <div className="bg-secondary/40 p-4 rounded-lg">
          <ActivityList activities={sortedActivities} />
        </div>

        <div className="mt-8">
          <GoalManager />
        </div>
      </div>
    </main>
  );
}