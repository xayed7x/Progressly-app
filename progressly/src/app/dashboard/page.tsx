import DashboardClientPage from "./DashboardClientPage";
import GoalManager from "./_components/GoalManager";

export default function DashboardPage() {
  return <DashboardClientPage goalManager={<GoalManager />} />;
}