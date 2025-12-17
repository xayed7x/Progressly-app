'use client';

import { storeAuthToken } from '@/lib/token-manager';
import { Suspense, useState, useEffect, useMemo } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
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
  goalManager?: React.ReactNode;
}) {
  const supabase = getSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);  // Initialize from effective_date
  const [optimisticActivities, setOptimisticActivities] = useState<
    ActivityReadWithCategory[]
  >([]);

  useEffect(() => {
    const initializeUser = async () => {
      setIsUserLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsUserLoading(false);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await storeAuthToken(session.access_token);
      }
    };

    initializeUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.access_token) {
          await storeAuthToken(session.access_token);
        }
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setIsUserLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const fetcher = async (url: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

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

  // Initialize selectedDate from backend's effective_date (based on wake-up logic)
  useEffect(() => {
    if (bootstrapData?.effective_date && selectedDate === null) {
      setSelectedDate(parseISO(bootstrapData.effective_date));
    }
  }, [bootstrapData?.effective_date, selectedDate]);

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
    if (!bootstrapData || !selectedDate) return [];
    return bootstrapData.activities_last_3_days.filter(act => {
      // Safety check: ensure activity_date exists
      if (!act.activity_date) return false;
      
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

  const isNextDisabled = !selectedDate || isToday(selectedDate);
  // Removed 3-day limit - users can now navigate back unlimited to view all historical activities
  const isPreviousDisabled = !selectedDate;

  // Add optimistic activity function
  const addOptimisticActivity = (activity: ActivityReadWithCategory) => {
    setOptimisticActivities((prev) => [activity, ...prev]);
    // Optionally, you could also update the bootstrap data optimistically
    // mutateBootstrap( ... );
  };

  // Navigation handlers
  const handleGoToPreviousDay = () => {
    if (!isPreviousDisabled && selectedDate) {
      setSelectedDate(subDays(selectedDate, 1));
    }
  };

  const handleGoToNextDay = () => {
    if (!isNextDisabled && selectedDate) {
      setSelectedDate(subDays(selectedDate, -1)); // Add one day (subtract negative)
    }
  };

  // Manual day advancement - for when user forgets to log sleep
  const handleEndDay = () => {
    if (selectedDate) {
      const nextDay = addDays(selectedDate, 1);
      setSelectedDate(nextDay);
    }
  };

  // New handler for when an activity is logged
  const handleActivityLogged = (newActivity: ActivityReadWithCategory) => {
    // Optimistically update the cache with the new activity
    if (bootstrapData) {
      mutateBootstrap(
        {
          ...bootstrapData,
          activities_last_3_days: [...bootstrapData.activities_last_3_days, newActivity],
        },
        { revalidate: true } // Then revalidate from server
      );
    } else {
      // If no bootstrap data yet, just force revalidation
      mutateBootstrap(undefined, { revalidate: true });
    }

    // Smart night sleep detection - only advance day for actual night sleep, not naps
    if (newActivity.category?.name?.toLowerCase() === 'sleep') {
      const endTimeStr = newActivity.end_time; // Format: "HH:mm:ss"
      const startTimeStr = newActivity.start_time;
      
      // Parse end time hour
      const endHour = parseInt(endTimeStr.split(':')[0], 10);
      
      // Calculate duration in hours
      const startParts = startTimeStr.split(':').map(Number);
      const endParts = endTimeStr.split(':').map(Number);
      let startMinutes = startParts[0] * 60 + startParts[1];
      let endMinutes = endParts[0] * 60 + endParts[1];
      
      // Handle overnight sleep (end time < start time)
      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60; // Add 24 hours
      }
      const durationHours = (endMinutes - startMinutes) / 60;
      
      // Night sleep criteria:
      // 1. Ends between 4 AM (4) and 12 PM (12)
      // 2. Duration >= 2 hours
      const isNightSleep = endHour >= 4 && endHour < 12 && durationHours >= 2;
      
      if (isNightSleep) {
        // Advance the date to the day after the sleep activity
        const sleepDate = parseISO(newActivity.activity_date);
        const nextDay = addDays(sleepDate, 1);
        setSelectedDate(nextDay);
      }
    }
  };

  // Wait for user to load before showing fallback
  const displayName = isUserLoading 
    ? 'Achiever' // Show default while loading
    : (user?.user_metadata?.full_name || user?.email || 'Achiever');

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col items-center justify-center gap-y-8">
          {/* Welcome Message */}
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-accent to-blue-500 bg-clip-text text-transparent">
            Welcome back, {displayName.split(' ')[0]}!
          </h1>

          {selectedDate ? (
            <>
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
                onEndDay={handleEndDay}
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
            </>
          ) : (
            <div className="text-center text-white/60">Loading your day...</div>
          )}

          {/* Goal Manager section - hidden for now
          <div className="mt-8">
            {goalManager}
          </div>
          */}
        </div>
      </div>
    </main>
  );
}