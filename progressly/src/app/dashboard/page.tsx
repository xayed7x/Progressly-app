import GoalManager from "./_components/GoalManager";
import DashboardClientPage from "./DashboardClientPage";

export default async function DashboardPage() {
  return (
    <DashboardClientPage
      goalManager={<GoalManager />}
    />
  );
}
