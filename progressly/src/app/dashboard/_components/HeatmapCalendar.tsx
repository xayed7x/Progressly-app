/**
 * HeatmapCalendar Component
 * GitHub-style contribution graph for challenge progress
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { DailyChallengeMetrics } from '@/lib/types';
import * as metricsService from '@/lib/services/metricsService';

interface HeatmapCalendarProps {
  challengeId: string;
  startDate: string;
  endDate: string;
  currentDay: number;
}

export function HeatmapCalendar({ challengeId, startDate, endDate, currentDay }: HeatmapCalendarProps) {
  const [metrics, setMetrics] = useState<Record<string, DailyChallengeMetrics>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await metricsService.getAllMetrics(challengeId);
        const metricsMap: Record<string, DailyChallengeMetrics> = {};
        data.forEach(m => {
          metricsMap[m.date] = m;
        });
        setMetrics(metricsMap);
      } catch (error) {
        console.error('Error loading heatmap data:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [challengeId]);

  const getColorClass = (completionPct: number | null | undefined): string => {
    if (completionPct === null || completionPct === undefined) return 'bg-muted';
    if (completionPct === 0) return 'bg-gray-300 dark:bg-gray-700';
    if (completionPct < 25) return 'bg-orange-200 dark:bg-orange-900';
    if (completionPct < 50) return 'bg-yellow-200 dark:bg-yellow-800';
    if (completionPct < 75) return 'bg-green-200 dark:bg-green-800';
    if (completionPct < 90) return 'bg-green-400 dark:bg-green-600';
    return 'bg-green-600 dark:bg-green-500';
  };

  const weeks = useMemo(() => {
    const result: { date: Date; dateStr: string; metric: DailyChallengeMetrics | null; isFuture: boolean }[][] = [];
    let currentWeek: typeof result[0] = [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Pad start to align with week start (Sunday)
    const firstDayOfWeek = start.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: new Date(0), dateStr: '', metric: null, isFuture: true });
    }
    
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const isFuture = current > today;
      
      currentWeek.push({
        date: new Date(current),
        dateStr,
        metric: metrics[dateStr] || null,
        isFuture
      });
      
      if (current.getDay() === 6) {
        result.push(currentWeek);
        currentWeek = [];
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    // Add remaining days
    if (currentWeek.length > 0) {
      // Pad end
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(0), dateStr: '', metric: null, isFuture: true });
      }
      result.push(currentWeek);
    }
    
    return result;
  }, [startDate, endDate, metrics]);

  if (isLoading) {
    return <div className="animate-pulse h-24 bg-muted rounded" />;
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1">
          {/* Day labels */}
          <div className="flex gap-1 mb-1">
            <div className="w-3" /> {/* Spacer for alignment */}
            {weeks[0]?.map((_, idx) => (
              <div key={idx} className="w-3 h-3 text-[8px] text-muted-foreground text-center">
                {dayLabels[idx]}
              </div>
            ))}
          </div>
          
          {/* Weeks */}
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex gap-1 items-center">
              {/* Week number */}
              <div className="w-3 text-[8px] text-muted-foreground text-right">
                {weekIdx + 1}
              </div>
              
              {/* Days */}
              {week.map((day, dayIdx) => {
                if (!day.dateStr) {
                  return <div key={dayIdx} className="w-3 h-3" />;
                }
                
                const completion = day.metric?.overall_completion_pct;
                const colorClass = day.isFuture 
                  ? 'bg-muted border border-dashed border-muted-foreground/20' 
                  : getColorClass(completion);
                
                return (
                  <Tooltip key={dayIdx}>
                    <TooltipTrigger asChild>
                      <div 
                        className={`w-3 h-3 rounded-sm cursor-pointer transition-transform hover:scale-125 ${colorClass}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <div className="font-medium">
                        Day {day.metric?.day_number || '—'}
                      </div>
                      <div className="text-muted-foreground">
                        {day.date.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                      {!day.isFuture && (
                        <div className={completion && completion >= 70 ? 'text-green-500' : 'text-orange-500'}>
                          {completion ?? 0}% complete
                        </div>
                      )}
                      {day.isFuture && (
                        <div className="text-muted-foreground">Future</div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Color legend */}
        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-gray-300 dark:bg-gray-700" />
          <div className="w-3 h-3 rounded-sm bg-orange-200 dark:bg-orange-900" />
          <div className="w-3 h-3 rounded-sm bg-yellow-200 dark:bg-yellow-800" />
          <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-800" />
          <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600" />
          <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500" />
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
