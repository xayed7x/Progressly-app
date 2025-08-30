import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import GoalForm from "./GoalForm";

// Type definition for Goal
type Goal = {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
};

// Function to fetch goals (moved from page.tsx)
async function getGoals(): Promise<Goal[]> {
  const { auth } = await import("@clerk/nextjs/server");
  const { getToken } = await auth();
  const token = await getToken({ template: "fastapi" });
  if (!token) return [];
  try {
    const res = await fetch("http://127.0.0.1:8000/api/goals", {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    return [];
  }
}

export default async function GoalManager() {
  // Fetch existing goals
  const goals = await getGoals();

  return (
    <Card className="bg-secondary text-textDark w-full max-w-lg">
      <CardHeader>
        <CardTitle>What is your main focus today?</CardTitle>
        <CardDescription>
          Set a clear goal to guide your actions.
        </CardDescription>
      </CardHeader>
      <GoalForm />

      {goals.length > 0 && (
        <div className="p-4 border-t border-textLight/20">
          <h3 className="text-lg font-semibold text-secondary mb-3">
            Your Goals
          </h3>
          <div className="space-y-2">
            {goals.map((goal) => (
              <div key={goal.id} className="p-3 bg-white/50 rounded-lg">
                <p className="text-textDark">{goal.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
