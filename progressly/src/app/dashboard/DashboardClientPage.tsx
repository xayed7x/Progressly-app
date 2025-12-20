'use client';

import { storeAuthToken } from '@/lib/token-manager';
import { Suspense, useState, useEffect, useMemo } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import type { User } from '@supabase/supabase-js';
import useSWR from 'swr';
import { isToday, subDays, parseISO, addDays, format } from 'date-fns';

import ActivityLogger from './_components/ActivityLogger';
import { ActivitiesWrapper } from './_components/ActivitiesWrapper';
import {
  DailySummaryChart,
  ChartSkeleton,
} from './_components/DailySummaryChart';
import { DaySelector } from './_components/DaySelector';

// Challenge system imports
import { ChallengeSetup } from './_components/ChallengeSetup';
import { ChallengeDashboard } from './_components/ChallengeDashboard';
import { EndOfDaySummary } from './_components/EndOfDaySummary';
import { DailyCoachInsight } from './_components/DailyCoachInsight';
import { useChallenges } from '@/hooks/useChallenges';
import type { CommitmentProgress } from '@/lib/types';

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
  const [endedDate, setEndedDate] = useState<string | null>(null);  // Track which date was ended
  const [optimisticActivities, setOptimisticActivities] = useState<
    ActivityReadWithCategory[]
  >([]);

  // Challenge system state
  const [showChallengeSetup, setShowChallengeSetup] = useState(false);
  const [showEndOfDay, setShowEndOfDay] = useState(false);
  const [commitmentProgress, setCommitmentProgress] = useState<Record<string, CommitmentProgress>>({});

  // Challenge hook - provides active challenge and operations
  const { 
    activeChallenge, 
    todayMetrics, 
    currentDayNumber, 
    createChallenge, 
    refetch: refetchChallenge 
  } = useChallenges(user?.id || null);

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
    // Only fetch when user is loaded to avoid auth errors on refresh
    user ? `${API_BASE_URL}/api/dashboard-bootstrap` : null,
    fetcher,
    {
      revalidateOnFocus: true, // Refresh when window regains focus
      revalidateOnReconnect: true, // Refresh when network reconnects
      revalidateOnMount: true, // Always revalidate on mount
      dedupingInterval: 0, // Don't dedupe requests - always fetch fresh
    }
  );

  // Track if we've already initialized from localStorage
  const [dateInitialized, setDateInitialized] = useState(false);

  // localStorage is now only used as a fallback during the same session
  // For cross-device sync, backend user_sessions table is authoritative

  // PRIORITY 1: Use backend effective_date (from user_sessions table) - this is authoritative for cross-device sync
  useEffect(() => {
    if (bootstrapData?.effective_date && !dateInitialized) {
      console.log('[Progressly] Using effective_date from backend (cross-device sync):', bootstrapData.effective_date);
      setSelectedDate(parseISO(bootstrapData.effective_date));
      setDateInitialized(true);
      
      // Also update localStorage to match backend
      const storageData = {
        date: bootstrapData.effective_date,
        endedAt: new Date().toISOString(),
        endedDateStr: ''  // Unknown since we're loading from backend
      };
      localStorage.setItem('progressly_manual_day_end', JSON.stringify(storageData));
    }
  }, [bootstrapData?.effective_date, dateInitialized]);

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
    // Use format() for consistent local date - avoids timezone issues with toISOString()
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    
    console.log('[Progressly] Filtering activities for date:', selectedDateStr);
    
    return bootstrapData.activities_last_3_days.filter(act => {
      // Use effective_date if available (psychological day), fallback to activity_date
      if (act.effective_date) {
        // effective_date is already in YYYY-MM-DD format from backend
        const match = act.effective_date === selectedDateStr;
        if (match) console.log('[Progressly] Activity matched:', act.activity_name, 'effective_date:', act.effective_date);
        return match;
      }
      
      // Fallback for old activities without effective_date
      if (!act.activity_date) return false;
      const activityDate = format(parseISO(act.activity_date), 'yyyy-MM-dd');
      return activityDate === selectedDateStr;
    });
  }, [bootstrapData, selectedDate]);

  // Memoize pie chart data calculation
  const pieChartDataForSelectedDate = useMemo((): PieChartData[] => {
    if (!bootstrapData) return [];

    // Always calculate from the activities for the selected date
    const categoryDurations: { [key: string]: { name: string; color: string; duration: number } } = {};

    for (const activity of activitiesForSelectedDate) {
      if (activity.category) {
        const duration = calculateDuration(activity.start_time, activity.end_time);
        const catId = String(activity.category.id);
        if (categoryDurations[catId]) {
          categoryDurations[catId].duration += duration;
        } else {
          categoryDurations[catId] = {
            name: activity.category.name,
            color: activity.category.color,
            duration: duration,
          };
        }
      }
    }
    
    // Convert to array with numeric ids (using index)
    const data = Object.entries(categoryDurations).map(([catId, val], index) => ({
      id: index + 1, // Use sequential numeric ID to avoid NaN
      name: val.name,
      color: val.color,
      duration: val.duration,
    }));
    
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
  const handleEndDay = async () => {
    if (selectedDate) {
      // Use format() for consistent local date - avoid timezone issues with toISOString()
      const endedDateStr = format(selectedDate, 'yyyy-MM-dd'); // The date being ended
      const nextDay = addDays(selectedDate, 1);
      const nextDayStr = format(nextDay, 'yyyy-MM-dd'); // The new current date
      
      console.log('[Progressly] End My Day clicked - ending:', endedDateStr, 'advancing to:', nextDayStr);
      
      // Mark this date as ended (locks the button)
      setEndedDate(endedDateStr);
      
      // Update UI immediately
      setSelectedDate(nextDay);
      
      // Save to localStorage FIRST (most reliable)
      const storageData = {
        date: nextDayStr,
        endedAt: new Date().toISOString(),
        endedDateStr: endedDateStr
      };
      localStorage.setItem('progressly_manual_day_end', JSON.stringify(storageData));
      console.log('[Progressly] Saved to localStorage:', storageData);
      
      // Save to backend for cross-device sync
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const response = await fetch(`${API_BASE_URL}/api/end-day`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ new_effective_date: nextDayStr }),
          });
          
          if (response.ok) {
            console.log('[Progressly] End Day saved to backend for cross-device sync');
          }
        }
      } catch (error) {
        console.error('[Progressly] Failed to save End Day to backend:', error);
      }
    }
  };

  // New handler for when an activity is logged
  const handleActivityLogged = (newActivity: ActivityReadWithCategory) => {
    // Optimistically update the cache with the new activity AND the last_end_time
    if (bootstrapData) {
      mutateBootstrap(
        {
          ...bootstrapData,
          activities_last_3_days: [...bootstrapData.activities_last_3_days, newActivity],
          last_end_time: newActivity.end_time, // Update last_end_time for the form
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
        // Clear manual day end since sleep is now detected
        localStorage.removeItem('progressly_manual_day_end');
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

          {/* Challenge Section */}
          {!activeChallenge ? (
            <div className="w-full max-w-lg p-6 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-xl border border-primary/20 text-center">
              <h2 className="text-xl font-semibold mb-2">Start Your Challenge</h2>
              <p className="text-white/60 text-sm mb-4">
                Transform your habits with a 100-day consistency challenge
              </p>
              <button
                onClick={() => setShowChallengeSetup(true)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                🎯 Create Challenge
              </button>
            </div>
          ) : (
            <div className="w-full max-w-lg space-y-4">
              <DailyCoachInsight
                challengeId={activeChallenge.id}
                userId={user?.id || ''}
                onOpenChat={() => window.location.href = '/chat'}
              />
              <ChallengeDashboard
                challenge={activeChallenge}
                todayMetrics={todayMetrics}
                currentDayNumber={currentDayNumber || 1}
                activities={activitiesForSelectedDate}
                categories={sortedCategories}
                onOpenEndOfDay={() => setShowEndOfDay(true)}
                onOpenCoach={() => window.location.href = '/chat'}
                onActivityLogged={() => {
                  refetchChallenge();
                  mutateBootstrap();
                }}
                // Logger Props
                lastEndTime={bootstrapData?.last_end_time?.substring(0, 5) ?? undefined}
                addOptimisticActivity={addOptimisticActivity}
                selectedDate={selectedDate || new Date()}
                // List Props
                optimisticActivities={optimisticActivities}
                isLoadingActivities={isLoadingBootstrap}
                onActivityUpdated={mutateBootstrap}
                // Chart Props
                pieChartData={pieChartDataForSelectedDate}
                // Navigation Props
                onPreviousClick={handleGoToPreviousDay}
                onNextClick={handleGoToNextDay}
                onEndDay={handleEndDay}
                isPreviousDisabled={isPreviousDisabled}
                isNextDisabled={isNextDisabled}
                isDayEnded={endedDate === (selectedDate || new Date()).toISOString().split('T')[0]}
              />
            </div>
          )}

          {selectedDate ? (
            <>
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

      {/* Challenge Setup Modal */}
      <ChallengeSetup
        isOpen={showChallengeSetup}
        onClose={() => setShowChallengeSetup(false)}
        onComplete={async (input) => {
          await createChallenge(input);
          setShowChallengeSetup(false);
          refetchChallenge();
        }}
        categories={sortedCategories}
      />

      {/* End of Day Summary Modal */}
      {activeChallenge && (
        <EndOfDaySummary
          isOpen={showEndOfDay}
          onClose={() => setShowEndOfDay(false)}
          challenge={activeChallenge}
          activities={activitiesForSelectedDate}
          commitmentProgress={commitmentProgress}
          onComplete={() => {
            setShowEndOfDay(false);
            refetchChallenge();
            mutateBootstrap();
          }}
        />
      )}
    </main>
  );
}