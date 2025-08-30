import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Re-using the Goal type we defined in our page.tsx
type Goal = {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
};

type GoalListProps = {
  goals: Goal[];
};

export default function GoalList({ goals }: GoalListProps) {
  // If there are no goals, show a message
  if (goals.length === 0) {
    return (
      <div className="text-center text-textLight">
        <p>You haven't set any goals yet.</p>
        <p>What's your main focus today?</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-secondary">Your Goals</h2>
      {goals.map((goal) => (
        <Card key={goal.id} className="bg-secondary text-textDark">
          <CardContent className="p-4">
            <p>{goal.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
