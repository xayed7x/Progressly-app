/**
 * Metrics Service
 * Handles daily challenge metrics calculations
 */

import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import type { 
  DailyChallengeMetrics, 
  Challenge,
  CommitmentDayStatus,
  CommitmentStatusType,
  MoodType,
  ActivityReadWithCategory
} from '@/lib/types';

// Cast as any to bypass TypeScript checking for new tables
// TODO: Regenerate Supabase types after running migrations
const supabase: any = getSupabaseBrowserClient();

/**
 * Get metrics for a specific day
 */
export async function getDailyMetrics(
  challengeId: string,
  date: string
): Promise<DailyChallengeMetrics | null> {
  const { data, error } = await supabase
    .from('daily_challenge_metrics' as any)
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('date', date)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching daily metrics:', error);
    throw new Error(error.message);
  }

  return data as DailyChallengeMetrics;
}

/**
 * Get all metrics for a challenge
 */
export async function getAllMetrics(
  challengeId: string
): Promise<DailyChallengeMetrics[]> {
  const { data, error } = await supabase
    .from('daily_challenge_metrics' as any)
    .select('*')
    .eq('challenge_id', challengeId)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching all metrics:', error);
    throw new Error(error.message);
  }

  return (data || []) as DailyChallengeMetrics[];
}

/**
 * Get metrics for a date range
 */
export async function getMetricsRange(
  challengeId: string,
  startDate: string,
  endDate: string
): Promise<DailyChallengeMetrics[]> {
  const { data, error } = await supabase
    .from('daily_challenge_metrics' as any)
    .select('*')
    .eq('challenge_id', challengeId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching metrics range:', error);
    throw new Error(error.message);
  }

  return (data || []) as DailyChallengeMetrics[];
}

/**
 * Calculate and update daily metrics based on activities
 */
export async function calculateDailyMetrics(
  challengeId: string,
  date: string,
  challenge: Challenge,
  activities: ActivityReadWithCategory[]
): Promise<DailyChallengeMetrics> {
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  const dayNumber = calculateDayNumber(challenge.start_date, date);
  
  // Filter activities for this date and relevant categories
  const todayActivities = activities.filter(a => 
    a.effective_date === date || a.activity_date?.split('T')[0] === date
  );

  // Calculate status for each commitment
  const commitmentsStatus: Record<string, CommitmentDayStatus> = {};
  let totalCompletionPct = 0;
  let applicableCount = 0;
  let hasAnyActivity = false;

  for (const commitment of challenge.commitments) {
    // Check if commitment applies today (for weekly commitments)
    const todayDayNum = new Date(date).getDay(); // 0-6
    const isApplicable = commitment.frequency === 'daily' || 
      (commitment.daysOfWeek && commitment.daysOfWeek.includes(todayDayNum));

    if (!isApplicable) {
      commitmentsStatus[commitment.id] = {
        target: commitment.target,
        actual: 'not_scheduled',
        unit: commitment.unit,
        completion_pct: null,
        status: 'not_applicable'
      };
      continue;
    }

    // Find activities matching this commitment's category
    const relevantActivities = todayActivities.filter(
      a => a.category?.name === commitment.category || 
           a.category?.id?.toString() === commitment.categoryId?.toString()
    );

    if (relevantActivities.length > 0) {
      hasAnyActivity = true;
    }

    if (commitment.target === 'complete') {
      // Completion-based commitment
      const isComplete = relevantActivities.length > 0;
      const completionPct = isComplete ? 100 : 0;
      
      commitmentsStatus[commitment.id] = {
        target: 'complete',
        actual: isComplete ? 'yes' : 'no',
        unit: null,
        completion_pct: completionPct,
        status: isComplete ? 'complete' : 'not_started'
      };
      
      totalCompletionPct += completionPct;
      applicableCount++;
    } else {
      // Hours-based commitment
      const totalMinutes = relevantActivities.reduce((sum, a) => {
        const start = new Date(`1970-01-01T${a.start_time}`);
        const end = new Date(`1970-01-01T${a.end_time}`);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60);
      }, 0);
      
      const actualHours = totalMinutes / 60;
      const targetHours = commitment.target as number;
      const completionPct = Math.min((actualHours / targetHours) * 100, 100);
      
      let status: CommitmentStatusType = 'not_started';
      if (completionPct === 0) status = 'not_started';
      else if (completionPct >= 100) status = 'complete';
      else if (completionPct >= 50) status = 'partial';
      else status = 'in_progress';

      commitmentsStatus[commitment.id] = {
        target: targetHours,
        actual: Math.round(actualHours * 100) / 100,
        unit: commitment.unit || 'hours',
        completion_pct: Math.round(completionPct),
        status
      };
      
      totalCompletionPct += completionPct;
      applicableCount++;
    }
  }

  const overallPct = applicableCount > 0 ? totalCompletionPct / applicableCount : 0;
  const consistencyScore = hasAnyActivity ? 100 : 0;
  const diligenceScore = overallPct;

  // Get previous metrics for cumulative calculations
  const previousMetrics = await getMetricsRange(challengeId, challenge.start_date, date);
  const allPrevMetrics = previousMetrics.filter(m => m.date < date);
  
  const totalDays = allPrevMetrics.length + 1;
  const consistentDays = allPrevMetrics.filter(m => m.consistency_score > 0).length + (hasAnyActivity ? 1 : 0);
  const cumulativeConsistency = (consistentDays / totalDays) * 100;
  const cumulativeDiligence = (allPrevMetrics.reduce((sum, m) => sum + m.diligence_score, 0) + diligenceScore) / totalDays;

  // Calculate streak
  let streak = hasAnyActivity && overallPct >= 70 ? 1 : 0;
  if (streak > 0) {
    for (let i = allPrevMetrics.length - 1; i >= 0; i--) {
      if (allPrevMetrics[i].overall_completion_pct >= 70) {
        streak++;
      } else {
        break;
      }
    }
  }

  // Upsert the metrics
  const metricsData = {
    challenge_id: challengeId,
    date,
    day_number: dayNumber,
    commitments_status: commitmentsStatus,
    overall_completion_pct: Math.round(overallPct),
    consistency_score: consistencyScore,
    diligence_score: Math.round(diligenceScore),
    cumulative_consistency_rate: Math.round(cumulativeConsistency),
    cumulative_diligence_rate: Math.round(cumulativeDiligence),
    day_of_week: dayOfWeek,
    consecutive_completion_streak: streak
  };

  const { data, error } = await supabase
    .from('daily_challenge_metrics' as any)
    .upsert(metricsData as any, { onConflict: 'challenge_id,date' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting metrics:', error);
    throw new Error(error.message);
  }

  return data as DailyChallengeMetrics;
}

/**
 * Update mood, energy, and notes for a day
 */
export async function updateDailyContext(
  challengeId: string,
  date: string,
  context: {
    mood?: MoodType;
    energy_level?: number;
    notes?: string;
  }
): Promise<DailyChallengeMetrics> {
  const { data, error } = await supabase
    .from('daily_challenge_metrics' as any)
    .update(context as any)
    .eq('challenge_id', challengeId)
    .eq('date', date)
    .select()
    .single();

  if (error) {
    console.error('Error updating daily context:', error);
    throw new Error(error.message);
  }

  return data as DailyChallengeMetrics;
}

/**
 * Detect missing time blocks in a day
 */
export function detectMissingTimeBlocks(
  activities: ActivityReadWithCategory[],
  startHour: number = 6,  // Day starts at 6 AM
  endHour: number = 22    // Day ends at 10 PM
): { start: string; end: string; duration_minutes: number }[] {
  const gaps: { start: string; end: string; duration_minutes: number }[] = [];
  
  // Sort activities by start time
  const sorted = [...activities].sort((a, b) => 
    a.start_time.localeCompare(b.start_time)
  );

  const formatTime = (h: number) => `${h.toString().padStart(2, '0')}:00:00`;
  let currentTime = formatTime(startHour);
  const dayEnd = formatTime(endHour);

  for (const activity of sorted) {
    if (activity.start_time > currentTime) {
      const gapMinutes = calculateMinutesBetween(currentTime, activity.start_time);
      if (gapMinutes > 30) { // Only report gaps > 30 minutes
        gaps.push({
          start: currentTime,
          end: activity.start_time,
          duration_minutes: gapMinutes
        });
      }
    }
    if (activity.end_time > currentTime) {
      currentTime = activity.end_time;
    }
  }

  // Check gap at end of day
  if (currentTime < dayEnd) {
    const gapMinutes = calculateMinutesBetween(currentTime, dayEnd);
    if (gapMinutes > 30) {
      gaps.push({
        start: currentTime,
        end: dayEnd,
        duration_minutes: gapMinutes
      });
    }
  }

  return gaps;
}

// Helper functions
function calculateDayNumber(startDate: string, currentDate: string): number {
  const start = new Date(startDate);
  const current = new Date(currentDate);
  const diffTime = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

function calculateMinutesBetween(time1: string, time2: string): number {
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}
