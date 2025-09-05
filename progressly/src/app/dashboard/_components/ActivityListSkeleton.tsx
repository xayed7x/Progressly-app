import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActivityListSkeleton() {
  return (
    <div className="w-full max-w-lg space-y-4">
      <h2 className="text-xl font-semibold text-secondary text-center">
        Today's Log
      </h2>
      <div className="space-y-3">
        {/* Render 5 skeleton cards to simulate a list loading */}
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="mb-4 bg-secondary/90">
            <CardContent className="grid grid-cols-[1fr_90px_auto] items-center gap-4 p-3">
              {/* Skeleton for Activity Name */}
              <Skeleton className="h-5 w-3/4 bg-primary/20" />

              {/* Skeleton for Category Badge */}
              <Skeleton className="h-6 w-[80px] rounded-full bg-primary/20" />

              {/* Skeleton for Time */}
              <Skeleton className="h-4 w-[100px] bg-primary/20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
