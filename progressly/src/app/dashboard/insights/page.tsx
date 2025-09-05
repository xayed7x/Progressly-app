import { DailySummaryChart } from "../_components/DailySummaryChart";

export default function InsightsPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-serif text-secondary mb-2">Your Insights</h1>
      {/* CHANGE THIS LINE: Use text-secondary for high contrast on dark backgrounds */}
      <p className="text-secondary mb-8">
        A visual summary of how you invest your time.
      </p>

      <div className="max-w-4xl mx-auto">
        <DailySummaryChart />
      </div>
    </div>
  );
}
