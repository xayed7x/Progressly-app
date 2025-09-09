import { Card, CardContent } from "@/components/ui/card";

export default function ActivityListSkeleton() {
  return (
    <div className="w-full max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-secondary text-center">
        Today's Log
      </h2>
      <div className="space-y-3">
        {/* Render 5 skeleton cards to simulate a list loading */}
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="w-full border border-orange-300">
            <CardContent className="p-4 bg-pink-50">
              {/* 3-Part Layout: Activity Name, Time Span, Category Badge */}
              <div className="flex flex-col gap-2">
                {/* Activity Name (Prominent) */}
                <div className="h-4 w-3/4 bg-red-300 rounded animate-pulse" />
                
                {/* Time Span and Category Badge on one line */}
                <div className="flex justify-between items-center">
                  <div className="h-3 w-24 bg-blue-300 rounded animate-pulse" />
                  <div className="h-6 w-16 bg-green-300 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
