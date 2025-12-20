"use client";

/**
 * QuickTapLogging Component - ENHANCED VERSION with Cross-Device Sync
 * 
 * Features:
 * - Shows ALL default categories (not just user-created ones)
 * - API integration via server action to save activities
 * - Backend sync for cross-device timer persistence
 * - localStorage as offline fallback
 * - Optimistic updates
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Square, RefreshCw } from 'lucide-react';
import type { Category, ActivityReadWithCategory } from '@/lib/types';
import { logActivity } from '@/app/dashboard/activity-actions';
import { createCategory } from '@/app/dashboard/category-actions';
import { CATEGORY_CONFIG } from '@/lib/category-config';
import { defaultActivityCategories, defaultCategoryHexColors } from '@/lib/constants';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';

interface QuickTapLoggingProps {
  categories: Category[];
  onActivityLogged: (activity?: ActivityReadWithCategory) => void;
  addOptimisticActivity?: (activity: any) => void;
  selectedDate: Date;
}

interface RunningActivity {
  categoryId: string;
  categoryName: string;
  startTime: string; // ISO string for persistence
}

interface QuickTapCategory {
  id: string;
  name: string;
  isUserCategory: boolean;
}

const STORAGE_KEY = 'progressly_running_activity';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export function QuickTapLogging({ 
  categories, 
  onActivityLogged, 
  addOptimisticActivity,
  selectedDate 
}: QuickTapLoggingProps) {
  const supabase = getSupabaseBrowserClient();
  const [runningActivity, setRunningActivity] = useState<RunningActivity | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Build display categories: merge user categories with default presets
  const displayCategories = useMemo((): QuickTapCategory[] => {
    const result: QuickTapCategory[] = [];

    defaultActivityCategories.slice(0, 8).forEach(defaultName => {
      const userCategory = categories.find(
        c => c.name.toLowerCase() === defaultName.toLowerCase()
      );

      if (userCategory) {
        result.push({
          id: userCategory.id,
          name: userCategory.name,
          isUserCategory: true
        });
      } else {
        result.push({
          id: `preset-${defaultName}`,
          name: defaultName,
          isUserCategory: false
        });
      }
    });

    return result;
  }, [categories]);

  // Fetch active timer from backend on mount (cross-device sync)
  const fetchActiveTimer = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        // Not authenticated, use localStorage only
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as RunningActivity;
          setRunningActivity(parsed);
        }
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/timer/active`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.active_timer) {
          setRunningActivity({
            categoryId: data.active_timer.category_id,
            categoryName: data.active_timer.category_name,
            startTime: data.active_timer.start_time
          });
          // Also save to localStorage as backup
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            categoryId: data.active_timer.category_id,
            categoryName: data.active_timer.category_name,
            startTime: data.active_timer.start_time
          }));
        } else {
          // No backend timer, check localStorage fallback
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as RunningActivity;
              if (parsed.categoryId && parsed.categoryName && parsed.startTime) {
                setRunningActivity(parsed);
                // Sync to backend
                syncTimerToBackend(parsed);
              }
            } catch (e) {
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        }
      } else {
        // Backend failed, use localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as RunningActivity;
          setRunningActivity(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to fetch active timer:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RunningActivity;
        setRunningActivity(parsed);
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Sync timer to backend
  const syncTimerToBackend = async (timer: RunningActivity | null) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        console.warn('Cannot sync timer: not authenticated');
        return;
      }
      
      if (timer) {
        await fetch(`${API_BASE_URL}/api/timer/active`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            category_id: timer.categoryId,
            category_name: timer.categoryName,
            start_time: timer.startTime
          })
        });
      } else {
        await fetch(`${API_BASE_URL}/api/timer/active`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Failed to sync timer to backend:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchActiveTimer();
  }, [fetchActiveTimer]);

  // Save to localStorage whenever it changes (backup)
  useEffect(() => {
    if (runningActivity) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(runningActivity));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [runningActivity]);

  // Timer effect
  useEffect(() => {
    if (runningActivity) {
      const updateElapsed = () => {
        const startDate = new Date(runningActivity.startTime);
        const elapsed = Date.now() - startDate.getTime();
        setElapsedTime(Math.floor(elapsed / 1000));
      };
      
      updateElapsed();
      timerRef.current = setInterval(updateElapsed, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setElapsedTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [runningActivity]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatTimeForApi = (date: Date): string => {
    return date.toTimeString().slice(0, 5);
  };

  const handleStart = useCallback(async (category: QuickTapCategory) => {
    if (runningActivity) {
      await handleStop();
    }

    let categoryId = category.id;

    // If this is a preset (not user's category), create it first
    if (!category.isUserCategory) {
      try {
        const formData = new FormData();
        formData.set('name', category.name);
        formData.set('color', defaultCategoryHexColors[category.name] || '#808080');
        
        const result = await createCategory(formData);
        if (result.success && result.data) {
          categoryId = String(result.data.id);
        } else {
          console.error('Failed to create category:', result.error);
          return;
        }
      } catch (error) {
        console.error('Error creating category:', error);
        return;
      }
    }

    const newTimer: RunningActivity = {
      categoryId: categoryId,
      categoryName: category.name,
      startTime: new Date().toISOString()
    };

    setRunningActivity(newTimer);
    
    // Sync to backend for cross-device
    syncTimerToBackend(newTimer);
  }, [runningActivity]);

  const handleStop = useCallback(async () => {
    if (!runningActivity || isSaving) return;

    setIsSaving(true);
    
    try {
      const startDate = new Date(runningActivity.startTime);
      const endDate = new Date();
      
      const startTimeStr = formatTimeForApi(startDate);
      const endTimeStr = formatTimeForApi(endDate);
      
      const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
      
      if (durationMinutes < 1) {
        setRunningActivity(null);
        syncTimerToBackend(null);
        setIsSaving(false);
        return;
      }

      const activityDate = selectedDate.toISOString().split('T')[0];

      const formData = new FormData();
      formData.set('activity_name', runningActivity.categoryName);
      formData.set('category_id', runningActivity.categoryId);
      formData.set('start_time', startTimeStr);
      formData.set('end_time', endTimeStr);

      if (addOptimisticActivity) {
        const optimisticActivity = {
          id: `temp-${Date.now()}`,
          activity_name: runningActivity.categoryName,
          start_time: startTimeStr,
          end_time: endTimeStr,
          activity_date: activityDate,
          category_id: runningActivity.categoryId,
          category: categories.find(c => c.id === runningActivity.categoryId) || null,
          isPendingSync: true,
        };
        addOptimisticActivity(optimisticActivity);
      }

      const result = await logActivity(formData, activityDate);

      if (result.success) {
        setRunningActivity(null);
        syncTimerToBackend(null); // Clear backend timer
        onActivityLogged(result.data || undefined);
      } else {
        console.error('Failed to save activity:', result.error);
      }
      
    } catch (error) {
      console.error('Failed to save activity:', error);
    } finally {
      setIsSaving(false);
    }
  }, [runningActivity, isSaving, selectedDate, addOptimisticActivity, onActivityLogged, categories]);

  const isCategoryRunning = (categoryId: string) => 
    runningActivity?.categoryId === categoryId || 
    (runningActivity?.categoryName && displayCategories.find(c => c.name === runningActivity.categoryName)?.id === categoryId);

  const getCategoryIcon = (categoryName: string) => {
    const config = CATEGORY_CONFIG[categoryName as keyof typeof CATEGORY_CONFIG];
    return config?.icon || CATEGORY_CONFIG["Default"].icon;
  };

  if (isLoading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-white/60">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Syncing timer...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between text-white">
          <span className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Quick Tap Logging
          </span>
          {runningActivity && (
            <span className="text-accent1 font-mono text-lg animate-pulse">
              {formatTime(elapsedTime)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Currently running indicator */}
        {runningActivity && (
          <div className="mb-4 p-3 bg-accent1/20 rounded-lg flex items-center justify-between border border-accent1/30">
            <div>
              <p className="text-sm font-medium text-white">
                {runningActivity.categoryName}
              </p>
              <p className="text-xs text-white/60">
                Started at {new Date(runningActivity.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleStop}
              disabled={isSaving}
            >
              <Square className="w-4 h-4 mr-1" />
              {isSaving ? 'Saving...' : 'Stop'}
            </Button>
          </div>
        )}

        {/* Category grid */}
        <div className="grid grid-cols-4 gap-2">
          {displayCategories.map((category) => {
            const Icon = getCategoryIcon(category.name);
            const isRunning = isCategoryRunning(category.id);
            
            return (
              <button
                key={category.id}
                onClick={() => isRunning ? handleStop() : handleStart(category)}
                disabled={isSaving}
                className={`
                  flex flex-col items-center justify-center p-3 rounded-lg
                  transition-all duration-200 border-2
                  ${isRunning 
                    ? 'bg-accent1 text-black border-accent1 shadow-lg scale-105' 
                    : 'bg-white/5 hover:bg-white/10 border-transparent hover:border-accent1/30 text-white'
                  }
                  ${!category.isUserCategory && !isRunning ? 'opacity-70' : ''}
                  ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <Icon className={`w-5 h-5 mb-1 ${isRunning ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-medium truncate w-full text-center">
                  {category.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-white/40 text-center mt-3">
          Tap to start • Synced across devices
        </p>
      </CardContent>
    </Card>
  );
}
