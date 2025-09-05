"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center gap-y-8">
        {/* Welcome Header */}
        <Skeleton className="h-9 w-80" />

        {/* Activity Logger Card */}
        <Card className="bg-secondary text-textDark w-full max-w-lg">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Activity Name Input */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            
            {/* Time Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            
            {/* Category Select */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <div className="p-6 pt-0">
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>

        {/* Day Selector */}
        <div className="flex items-center justify-center gap-4 p-4 bg-secondary/20 rounded-lg w-full max-w-lg">
          <Skeleton className="h-9 w-20" />
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-9 w-16" />
        </div>

        {/* Today's Log Section */}
        <div className="w-full max-w-lg bg-secondary/40 p-4 rounded-lg">
          <Skeleton className="h-8 w-32 mb-4 mx-auto" />
          <div className="space-y-3">
            {/* Activity Cards */}
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="bg-secondary/90">
                <div className="grid grid-cols-[1fr_90px_auto_auto] items-center gap-4 p-3">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-16 mx-auto" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Daily Summary Chart */}
        <div className="mt-12 w-full max-w-2xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[350px]">
                <div className="text-center space-y-4">
                  <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
