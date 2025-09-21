'use client';

import { storeAuthToken } from '@/lib/token-manager';
import { Suspense, useState, useEffect, useMemo } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import useSWR from 'swr';
import { isToday, subDays, parseISO, addDays } from 'date-fns';

import ActivityLogger from './_components/ActivityLogger';
import { ActivitiesWrapper } from './_components/ActivitiesWrapper';
import {
  DailySummaryChart,
  ChartSkeleton,
} from './_components/DailySummaryChart';
import { DaySelector } from './_components/DaySelector';

import {
  Category,
  ActivityReadWithCategory,
  DashboardBootstrapData,
  PieChartData,
} from '@/lib/types';
import { defaultActivityCategories } from '@/lib/constants';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

// Helper function to calculate duration of an activity in minutes
function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);

  if (end < start) {
    // Handle overnight activities
    const midnight = new Date('1970-01-02T00:00:00');
    const duration = (midnight.getTime() - start.getTime() + (end.getTime() - new Date('1970-01-01T00:00:00').getTime())) / (1000 * 60);
    return duration;
  } else {
    return (end.getTime() - start.getTime()) / (1000 * 60);
  }
}

export default function DashboardClientPage({
  goalManager,
}: {
  goalManager: React.ReactNode;
}) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [optimisticActivities, setOptimisticActivities] = useState<
    ActivityReadWithCategory[]
  >([]);

  useEffect(() => {
    const storeToken = async () => {
      const token = await getToken({ template: 'fastapi' });
      if (token) {
        await storeAuthToken(token);
      }
    };

    storeToken(); // Store token on initial load
    const intervalId = setInterval(storeToken, 10 * 60 * 1000); // Store token every 10 minutes

    return () => clearInterval(intervalId);
  }, [getToken]);

  const fetcher = async (url: string) => {
    const token = await getToken({ template: 'fastapi' });
    if (!token) {
      throw new Error('User is not authenticated.');
    }
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error('Failed to fetch data');
    }
    return res.json();
  };

  const { 
    data: bootstrapData,
    isLoading: isLoadingBootstrap,
    mutate: mutateBootstrap,
  } = useSWR<DashboardBootstrapData>(
    `${API_BASE_URL}/api/dashboard-bootstrap`,
    fetcher
  );

  const sortedCategories = useMemo(() => {
    if (!bootstrapData?.categories) return [];

    const categories = bootstrapData.categories;
    const template = defaultActivityCategories;

    const defaultCats: Category[] = [];
    const customCats: Category[] = [];

    // Separate default and custom categories
    for (const category of categories) {
      if (template.includes(category.name)) {
        defaultCats.push(category);
      } else {
        customCats.push(category);
      }
    }

    // Sort default categories based on the template order
    defaultCats.sort((a, b) => template.indexOf(a.name) - template.indexOf(b.name));

    // Sort custom categories alphabetically
    customCats.sort((a, b) => a.name.localeCompare(b.name));

    return [...defaultCats, ...customCats];
  }, [bootstrapData]);

  // Memoize filtered activities for the selected date
  const activitiesForSelectedDate = useMemo(() => {
    if (!bootstrapData) return [];
    return bootstrapData.activities_last_3_days.filter(act => {
      // Important: Compare dates without time component
      const activityDate = parseISO(act.activity_date).toDateString();
      return activityDate === selectedDate.toDateString();
    });
  }, [bootstrapData, selectedDate]);

  // Memoize pie chart data calculation
  const pieChartDataForSelectedDate = useMemo((): PieChartData[] => {
    if (!bootstrapData) return [];

    // Always calculate from the activities for the selected date
    const categoryDurations: { [key: string]: PieChartData } = {};

    for (const activity of activitiesForSelectedDate) {
      if (activity.category) {
        const duration = calculateDuration(activity.start_time, activity.end_time);
        if (categoryDurations[activity.category.id]) {
          categoryDurations[activity.category.id].duration += duration;
        } else {
          categoryDurations[activity.category.id] = {
            id: parseInt(activity.category.id, 10),
            name: activity.category.name,
            color: activity.category.color,
            duration: duration,
          };
        }
      }
    }
    const data = Object.values(categoryDurations);
    
    // Sort data by duration in descending order
    return data.sort((a, b) => b.duration - a.duration);
  }, [bootstrapData, selectedDate, activitiesForSelectedDate]);

  // Calculate disabled states for navigation
  const today = new Date();
  const dayBeforeYesterday = subDays(today, 2);

  const isNextDisabled = isToday(selectedDate);
  const isPreviousDisabled = selectedDate.toDateString() === dayBeforeYesterday.toDateString();

  // Add optimistic activity function
  const addOptimisticActivity = (activity: ActivityReadWithCategory) => {
    setOptimisticActivities((prev) => [activity, ...prev]);
    // Optionally, you could also update the bootstrap data optimistically
    // mutateBootstrap( ... );
  };

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

  // New handler for when an activity is logged
  const handleActivityLogged = (newActivity: ActivityReadWithCategory) => {
    mutateBootstrap(); // Revalidate data

    // Check if the logged activity is 'Sleep'
    if (newActivity.category?.name === 'Sleep') {
      // Advance the date to the day after the sleep activity
      const sleepDate = parseISO(newActivity.activity_date);
      const nextDay = addDays(sleepDate, 1);
      setSelectedDate(nextDay);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center gap-y-8">
        <h1 className="text-center text-3xl font-bold text-secondary">
          Welcome back, {user?.firstName || 'Achiever'}!
        </h1>

        <ActivityLogger
          categories={sortedCategories}
          lastEndTime={bootstrapData?.last_end_time?.substring(0, 5) ?? undefined}
          onActivityLogged={handleActivityLogged} // Use the new handler
          addOptimisticActivity={addOptimisticActivity}
          selectedDate={selectedDate} // Pass down selectedDate
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
            activities={activitiesForSelectedDate}
            optimisticActivities={optimisticActivities}
            isLoading={isLoadingBootstrap}
            selectedDate={selectedDate}
            onActivityUpdated={mutateBootstrap}
          />
        </div>

        <div className="mt-12 w-full max-w-2xl">
          {isLoadingBootstrap ? (
            <ChartSkeleton />
          ) : (
            <DailySummaryChart
              selectedDate={selectedDate}
              data={pieChartDataForSelectedDate}
            />
          )}
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

