"use client";

import { Suspense, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import { isToday, subDays } from "date-fns";

import ActivityLogger from "./_components/ActivityLogger";
import { ActivitiesWrapper } from "./_components/ActivitiesWrapper";
import { DailySummaryChart, ChartSkeleton } from "./_components/DailySummaryChart";
import { DaySelector } from "./_components/DaySelector";
import { DashboardSkeleton } from "./_components/DashboardSkeleton";

import { Category, ActivityReadWithCategory } from "@/lib/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export default function DashboardClientPage({
  goalManager,
}: {
  goalManager: React.ReactNode;
}) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetcher = async (url: string) => {
    const token = await getToken({ template: "fastapi" });
    if (!token) {
      throw new Error("User is not authenticated.");
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }
    return res.json();
  };

  const { 
    data: activities,
    isLoading: isLoadingActivities,
    mutate: mutateActivities,
  } = useSWR<ActivityReadWithCategory[]>(
    `${API_BASE_URL}/api/activities?target_date=${selectedDate.toISOString().split('T')[0]}`,
    fetcher
  );

  const { data: categories } = useSWR<Category[]>(
    `${API_BASE_URL}/api/categories`,
    fetcher
  );

  let lastEndTime: string | undefined = undefined;
  if (activities && activities.length > 0) {
    // Find the activity with the latest end_time
    const latestActivity = activities.reduce((prev, current) => {
      const prevEndTime = new Date(`2000-01-01T${prev.end_time}`); // Use a dummy date for time comparison
      const currentEndTime = new Date(`2000-01-01T${current.end_time}`);
      return currentEndTime > prevEndTime ? current : prev;
    });

    // Format the latest end_time to "HH:mm"
    const latestEndHour = new Date(`2000-01-01T${latestActivity.end_time}`).getHours();
    const latestEndMinute = new Date(`2000-01-01T${latestActivity.end_time}`).getMinutes();
    lastEndTime = `${String(latestEndHour).padStart(2, '0')}:${String(latestEndMinute).padStart(2, '0')}`;
  }

  // Calculate disabled states for navigation
  const today = new Date();
  const dayBeforeYesterday = subDays(today, 2);
  
  const isNextDisabled = isToday(selectedDate);
  const isPreviousDisabled = selectedDate <= dayBeforeYesterday;

  // Navigation handlers
  const handleGoToPreviousDay = () => {
    if (!isPreviousDisabled) {
      setSelectedDate(subDays(selectedDate, 1));
    }
  };

  const handleGoToNextDay = () => {
    if (!isNextDisabled) {
      setSelectedDate(subDays(selectedDate, -1)); // Add one day (subtract negative)
    }
  };

  // Show skeleton while initial data is loading
  if (isLoadingActivities) {
    return <DashboardSkeleton />;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center gap-y-8">
        <h1 className="text-center text-3xl font-bold text-secondary">
          Welcome back, {user?.firstName || "Achiever"}!
        </h1>

        <ActivityLogger
          categories={categories ?? []}
          lastEndTime={lastEndTime}
          onActivityLogged={mutateActivities}
        />

        <DaySelector
          selectedDate={selectedDate}
          onPreviousClick={handleGoToPreviousDay}
          onNextClick={handleGoToNextDay}
          isPreviousDisabled={isPreviousDisabled}
          isNextDisabled={isNextDisabled}
        />

        <div className="w-full max-w-lg bg-secondary/40 p-4 rounded-lg">
          <ActivitiesWrapper
            activities={activities}
            isLoading={isLoadingActivities}
            selectedDate={selectedDate}
          />
        </div>

        <div className="mt-12">
          <Suspense fallback={<ChartSkeleton />}>
            <DailySummaryChart selectedDate={selectedDate} />
          </Suspense>
        </div>

        {/* Goal Manager section - hidden for now
        <div className="mt-8">
          {goalManager}
        </div>
        */}
      </div>
    </main>
  );
}
