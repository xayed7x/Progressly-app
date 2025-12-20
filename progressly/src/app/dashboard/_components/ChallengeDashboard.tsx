/**
 * ChallengeDashboard Component
 * Main dashboard view when user has an active challenge
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Play,
  MessageCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { 
  Challenge, 
  DailyChallengeMetrics,
  CommitmentProgress,
  ActivityReadWithCategory,
  Category,
  PieChartData
} from '@/lib/types';
import * as metricsService from '@/lib/services/metricsService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ActivityLogger from './ActivityLogger';
import { ActivitiesWrapper } from './ActivitiesWrapper';
import { DailySummaryChart } from './DailySummaryChart';
import { DaySelector } from './DaySelector'; // Import
import { DualRingProgress } from './DualRingProgress';
import { HeatmapCalendar } from './HeatmapCalendar';
import { QuickTapLogging } from './QuickTapLogging';

interface ChallengeDashboardProps {
  challenge: Challenge;
  todayMetrics: DailyChallengeMetrics | null;
  currentDayNumber: number;
  activities: ActivityReadWithCategory[];
  categories: Category[];
  onOpenEndOfDay: () => void;
  onOpenCoach: () => void;
  onActivityLogged: (activity?: ActivityReadWithCategory) => void;
  // Props for ActivityLogger
  lastEndTime?: string;
  addOptimisticActivity: (activity: any) => void;
  selectedDate: Date;
  // Props for ActivitiesWrapper
  optimisticActivities: ActivityReadWithCategory[];
  isLoadingActivities: boolean;
  onActivityUpdated: () => void;
  // Props for DailySummaryChart
  pieChartData: PieChartData[];
  // Props for DaySelector
  onPreviousClick: () => void;
  onNextClick: () => void;
  onEndDay: () => Promise<void>; 
  isPreviousDisabled: boolean;
  isNextDisabled: boolean;
  isDayEnded: boolean;
}

export function ChallengeDashboard({
  challenge,
  todayMetrics,
  currentDayNumber,
  activities,
  categories,
  onOpenEndOfDay,
  onOpenCoach,
  onActivityLogged,
  lastEndTime,
  addOptimisticActivity,
  selectedDate,
  optimisticActivities,
  isLoadingActivities,
  onActivityUpdated,
  pieChartData,
  // DaySelector props destruction
  onPreviousClick,
  onNextClick,
  onEndDay,
  isPreviousDisabled,
  isNextDisabled,
  isDayEnded
}: ChallengeDashboardProps) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [commitmentProgress, setCommitmentProgress] = useState<Record<string, CommitmentProgress>>({});

  const today = new Date().toISOString().split('T')[0];

  // Calculate progress for each commitment
  useEffect(() => {
    const progress: Record<string, CommitmentProgress> = {};
    
    // Filter today's activities
    const todayActivities = activities.filter(a => 
      a.effective_date === today || a.activity_date?.split('T')[0] === today
    );

    for (const commitment of challenge.commitments) {
      const relevantActivities = todayActivities.filter(
        a => a.category?.name === commitment.category
      );

      if (commitment.target === 'complete') {
        const isComplete = relevantActivities.length > 0;
        progress[commitment.id] = {
          commitmentId: commitment.id,
          target: 'complete',
          actual: isComplete ? 1 : 0,
          percentage: isComplete ? 100 : 0,
          status: isComplete ? 'complete' : 'not_started'
        };
      } else {
        const totalMinutes = relevantActivities.reduce((sum, a) => {
          const [h1, m1] = a.start_time.split(':').map(Number);
          const [h2, m2] = a.end_time.split(':').map(Number);
          return sum + ((h2 * 60 + m2) - (h1 * 60 + m1));
        }, 0);
        
        const actualHours = totalMinutes / 60;
        const targetHours = commitment.target as number;
        const percentage = Math.min((actualHours / targetHours) * 100, 100);

        progress[commitment.id] = {
          commitmentId: commitment.id,
          target: targetHours,
          actual: Math.round(actualHours * 10) / 10,
          percentage: Math.round(percentage),
          status: percentage === 0 ? 'not_started' : 
                  percentage >= 100 ? 'complete' : 
                  percentage >= 50 ? 'partial' : 'in_progress'
        };
      }
    }

    setCommitmentProgress(progress);
  }, [activities, challenge.commitments, today]);

  // Overall progress calculation
  const overallProgress = useMemo(() => {
    const values = Object.values(commitmentProgress);
    if (values.length === 0) return 0;
    return Math.round(
      values.reduce((sum, p) => sum + p.percentage, 0) / values.length
    );
  }, [commitmentProgress]);

  const consistencyRate = todayMetrics?.cumulative_consistency_rate || 0;
  const diligenceRate = todayMetrics?.cumulative_diligence_rate || 0;
  const currentStreak = todayMetrics?.consecutive_completion_streak || 0;

  return (
    <div className="space-y-6">
      {/* Challenge Header */}
      <Card className="bg-gradient-to-r from-white/5 to-white/10 border-white/10 text-white">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold font-serif">{challenge.name}</h2>
              <p className="text-gray-400">
                Day {currentDayNumber} of {challenge.duration_days}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-accent1">{overallProgress}%</p>
                <p className="text-xs text-gray-400">Today</p>
              </div>
              {currentStreak > 0 && (
                <div className="text-center px-3 py-1 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p className="text-lg font-bold text-orange-400">🔥 {currentStreak}</p>
                  <p className="text-xs text-gray-400">Streak</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Center (Tabs) */}
      <Tabs defaultValue="quick" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 bg-white/5 border border-white/10 p-1 rounded-lg">
          <TabsTrigger 
            value="quick"
            className="data-[state=active]:bg-accent1 data-[state=active]:text-primary"
          >
            ⚡ Quick Log
          </TabsTrigger>
          <TabsTrigger 
            value="manual"
            className="data-[state=active]:bg-accent1 data-[state=active]:text-primary"
          >
            📝 Manual Entry
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="quick" className="mt-0">
          <QuickTapLogging
            categories={categories}
            onActivityLogged={onActivityLogged}
            addOptimisticActivity={addOptimisticActivity}
            selectedDate={selectedDate}
          />
        </TabsContent>
        <TabsContent value="manual" className="mt-0">
           <div className="bg-transparent"> 
             {/* Wrap ActivityLogger to control its card width/style if needed 
                 ActivityLogger has its own Card, so we might want to strip it or use it as is.
                 It has w-full max-w-lg.
             */}
             <ActivityLogger
                categories={categories}
                lastEndTime={lastEndTime}
                onActivityLogged={onActivityLogged}
                addOptimisticActivity={addOptimisticActivity}
                selectedDate={selectedDate}
             />
           </div>
        </TabsContent>
      </Tabs>

      {/* Today's Commitments */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5" />
          Today's Commitments
        </h3>
        
        <div className="grid gap-3">
          {challenge.commitments.map((commitment) => {
            const progress = commitmentProgress[commitment.id];
            const isComplete = progress?.status === 'complete';
            
            return (
              <Card 
                key={commitment.id}
                className={`transition-all ${
                  isComplete 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {isComplete ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-muted-foreground" />
                        )}
                        <span className="font-medium">{commitment.habit}</span>
                        <span className="text-xs px-2 py-0.5 bg-muted rounded">
                          {commitment.category}
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">
                            {commitment.target === 'complete' 
                              ? (isComplete ? 'Completed' : 'Not started')
                              : `${progress?.actual || 0} / ${commitment.target} ${commitment.unit}`
                            }
                          </span>
                          <span className={isComplete ? 'text-green-600 font-medium' : ''}>
                            {progress?.percentage || 0}%
                          </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isComplete ? 'bg-green-500' : 
                              (progress?.percentage || 0) > 50 ? 'bg-yellow-500' : 'bg-primary dark:bg-accent1'
                            }`}
                            style={{ width: `${progress?.percentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {!isComplete && (
                      <Button variant="ghost" size="icon" className="ml-4">
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Day Selector (Navigation) */}
      <DaySelector
        selectedDate={selectedDate} // Already available
        onPreviousClick={onPreviousClick}
        onNextClick={onNextClick}
        onEndDay={onEndDay}
        isPreviousDisabled={isPreviousDisabled}
        isNextDisabled={isNextDisabled}
        isDayEnded={isDayEnded}
      />

      {/* Activities List (Visible Log) */}
      <ActivitiesWrapper
        activities={activities}
        optimisticActivities={optimisticActivities}
        isLoading={isLoadingActivities}
        selectedDate={selectedDate}
        onActivityUpdated={onActivityUpdated}
      />

      {/* Daily Summary Chart (Day Context) */}
      {isLoadingActivities ? (
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 space-y-2">
            <div className="h-6 w-1/3 bg-muted animate-pulse rounded" />
            <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded mt-4" />
          </div>
        </div>
      ) : (
        <DailySummaryChart data={pieChartData} selectedDate={selectedDate} />
      )}

      {/* Progress Rings & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-4">
            <DualRingProgress
              consistencyRate={consistencyRate}
              diligenceRate={diligenceRate}
              size={150}
              strokeWidth={12}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Consistency Rate</span>
              <span className="font-medium">{consistencyRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Diligence Rate</span>
              <span className="font-medium">{diligenceRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Streak</span>
              <span className="font-medium">{currentStreak} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Days Remaining</span>
              <span className="font-medium">{challenge.duration_days - currentDayNumber}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap Calendar (Collapsible) */}
      <Card>
        <CardHeader 
          className="cursor-pointer"
          onClick={() => setShowHeatmap(!showHeatmap)}
        >
          <CardTitle className="text-sm font-medium flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Challenge Calendar
            </span>
            {showHeatmap ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CardTitle>
        </CardHeader>
        {showHeatmap && (
          <CardContent>
            <HeatmapCalendar
              challengeId={challenge.id}
              startDate={challenge.start_date}
              endDate={challenge.end_date}
              currentDay={currentDayNumber}
            />
          </CardContent>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={onOpenCoach}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Talk to Coach
        </Button>
        <Button 
          className="flex-1"
          onClick={onOpenEndOfDay}
        >
          End Day Review
        </Button>
      </div>
    </div>
  );
}
