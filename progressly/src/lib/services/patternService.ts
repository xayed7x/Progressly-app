/**
 * Pattern Service
 * Detects behavioral patterns from challenge data
 */

import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import type { 
  BehaviorPattern,
  PatternType,
  WeakDayPatternData,
  StrongTimePatternData,
  RecoverySpeedPatternData,
  FailureTriggerPatternData,
  DailyChallengeMetrics,
  ActivityReadWithCategory
} from '@/lib/types';

const supabase = getSupabaseBrowserClient();

/**
 * Get all detected patterns for a challenge
 */
export async function getPatterns(
  challengeId: string,
  minConfidence: number = 50
): Promise<BehaviorPattern[]> {
  const { data, error } = await supabase
    .from('behavior_patterns')
    .select('*')
    .eq('challenge_id', challengeId)
    .gte('confidence_score', minConfidence)
    .order('confidence_score', { ascending: false });

  if (error) {
    console.error('Error fetching patterns:', error);
    throw new Error(error.message);
  }

  return (data || []) as BehaviorPattern[];
}

/**
 * Detect weak days (days of week with lowest completion)
 */
export async function detectWeakDays(
  challengeId: string,
  metrics: DailyChallengeMetrics[]
): Promise<void> {
  // Group by day of week
  const byDayOfWeek: Record<string, number[]> = {
    Sunday: [], Monday: [], Tuesday: [], Wednesday: [],
    Thursday: [], Friday: [], Saturday: []
  };

  for (const metric of metrics) {
    if (metric.day_of_week && metric.overall_completion_pct !== null) {
      byDayOfWeek[metric.day_of_week].push(metric.overall_completion_pct);
    }
  }

  // Calculate averages
  const averages: [string, number, number][] = []; // [day, avg, count]
  for (const [day, values] of Object.entries(byDayOfWeek)) {
    if (values.length >= 3) { // Need at least 3 samples
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      averages.push([day, avg, values.length]);
    }
  }

  if (averages.length === 0) return;

  // Find weakest day
  averages.sort((a, b) => a[1] - b[1]);
  const [weakestDay, avgCompletion, sampleSize] = averages[0];

  // Only save if significantly low
  if (avgCompletion < 70) {
    const patternData: WeakDayPatternData = {
      day: weakestDay,
      avg_completion: Math.round(avgCompletion),
      sample_size: sampleSize
    };

    await savePattern(challengeId, 'weak_day', patternData, Math.min(sampleSize * 10, 100));
  }
}

/**
 * Detect strong time blocks (peak productivity times)
 */
export async function detectStrongTimeBlocks(
  challengeId: string,
  activities: ActivityReadWithCategory[]
): Promise<void> {
  // Focus on study/work categories
  const focusCategories = ['Study', 'Work', 'Deep Work', 'Coding', 'Writing'];
  const focusActivities = activities.filter(
    a => a.category && focusCategories.some(c => 
      a.category!.name.toLowerCase().includes(c.toLowerCase())
    )
  );

  // Group by 3-hour time blocks
  const timeBlocks: Record<string, { durations: number[]; count: number }> = {
    'Early Morning (6-9am)': { durations: [], count: 0 },
    'Morning (9am-12pm)': { durations: [], count: 0 },
    'Afternoon (12-3pm)': { durations: [], count: 0 },
    'Late Afternoon (3-6pm)': { durations: [], count: 0 },
    'Evening (6-9pm)': { durations: [], count: 0 },
    'Night (9pm-12am)': { durations: [], count: 0 }
  };

  for (const activity of focusActivities) {
    const hour = parseInt(activity.start_time.split(':')[0]);
    let blockName = '';
    
    if (hour >= 6 && hour < 9) blockName = 'Early Morning (6-9am)';
    else if (hour >= 9 && hour < 12) blockName = 'Morning (9am-12pm)';
    else if (hour >= 12 && hour < 15) blockName = 'Afternoon (12-3pm)';
    else if (hour >= 15 && hour < 18) blockName = 'Late Afternoon (3-6pm)';
    else if (hour >= 18 && hour < 21) blockName = 'Evening (6-9pm)';
    else if (hour >= 21 || hour < 6) blockName = 'Night (9pm-12am)';

    if (blockName && timeBlocks[blockName]) {
      const duration = calculateDuration(activity.start_time, activity.end_time);
      timeBlocks[blockName].durations.push(duration);
      timeBlocks[blockName].count++;
    }
  }

  // Find strongest block
  let strongestBlock = '';
  let highestScore = 0;
  let strongestData: StrongTimePatternData | null = null;

  for (const [block, data] of Object.entries(timeBlocks)) {
    if (data.count >= 5) { // Need at least 5 sessions
      const avgDuration = data.durations.reduce((a, b) => a + b, 0) / data.durations.length;
      const productivityScore = avgDuration * data.count;
      
      if (productivityScore > highestScore) {
        highestScore = productivityScore;
        strongestBlock = block;
        strongestData = {
          time_block: block,
          avg_duration: Math.round(avgDuration),
          session_count: data.count,
          productivity_score: Math.round(productivityScore)
        };
      }
    }
  }

  if (strongestData) {
    await savePattern(challengeId, 'strong_time', strongestData, Math.min(strongestData.session_count * 8, 100));
  }
}

/**
 * Calculate recovery speed (how quickly user bounces back after misses)
 */
export async function calculateRecoverySpeed(
  challengeId: string,
  metrics: DailyChallengeMetrics[]
): Promise<void> {
  const sortedMetrics = [...metrics].sort((a, b) => a.date.localeCompare(b.date));
  const recoveryGaps: number[] = [];
  let consecutiveMisses = 0;

  for (const metric of sortedMetrics) {
    if (metric.overall_completion_pct < 50) {
      consecutiveMisses++;
    } else {
      if (consecutiveMisses > 0) {
        recoveryGaps.push(consecutiveMisses);
      }
      consecutiveMisses = 0;
    }
  }

  if (recoveryGaps.length === 0) return;

  const avgRecovery = recoveryGaps.reduce((a, b) => a + b, 0) / recoveryGaps.length;
  const patternData: RecoverySpeedPatternData = {
    avg_days_to_recover: Math.round(avgRecovery * 10) / 10,
    fastest: Math.min(...recoveryGaps),
    slowest: Math.max(...recoveryGaps),
    recovery_count: recoveryGaps.length
  };

  await savePattern(challengeId, 'recovery_speed', patternData, Math.min(recoveryGaps.length * 15, 100));
}

/**
 * Detect failure triggers (patterns in low-completion days)
 */
export async function detectFailureTriggers(
  challengeId: string,
  metrics: DailyChallengeMetrics[]
): Promise<void> {
  // Get low-completion days
  const lowDays = metrics.filter(m => m.overall_completion_pct < 50);
  
  if (lowDays.length < 3) return;

  // Count occurrences by day of week
  const dayCount: Record<string, number> = {};
  for (const day of lowDays) {
    if (day.day_of_week) {
      dayCount[day.day_of_week] = (dayCount[day.day_of_week] || 0) + 1;
    }
  }

  // Find most common trigger day
  const entries = Object.entries(dayCount).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return;

  const [triggerDay, count] = entries[0];
  
  if (count >= 3) {
    const patternData: FailureTriggerPatternData = {
      trigger_type: 'day_of_week',
      value: triggerDay,
      occurrence_count: count,
      total_low_days: lowDays.length
    };

    const confidence = Math.min((count / lowDays.length) * 100, 100);
    await savePattern(challengeId, 'failure_trigger', patternData, confidence);
  }
}

/**
 * Run all pattern detection
 */
export async function runPatternDetection(
  challengeId: string,
  metrics: DailyChallengeMetrics[],
  activities: ActivityReadWithCategory[]
): Promise<BehaviorPattern[]> {
  await Promise.all([
    detectWeakDays(challengeId, metrics),
    detectStrongTimeBlocks(challengeId, activities),
    calculateRecoverySpeed(challengeId, metrics),
    detectFailureTriggers(challengeId, metrics)
  ]);

  return getPatterns(challengeId);
}

/**
 * Save or update a pattern
 */
async function savePattern(
  challengeId: string,
  patternType: PatternType,
  patternData: WeakDayPatternData | StrongTimePatternData | RecoverySpeedPatternData | FailureTriggerPatternData,
  confidenceScore: number
): Promise<void> {
  // Check if pattern exists
  const { data: existing } = await supabase
    .from('behavior_patterns')
    .select('id')
    .eq('challenge_id', challengeId)
    .eq('pattern_type', patternType)
    .single();

  if (existing) {
    // Update existing
    await supabase
      .from('behavior_patterns')
      .update({
        pattern_data: patternData,
        confidence_score: Math.round(confidenceScore),
        last_updated: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    // Insert new
    await supabase
      .from('behavior_patterns')
      .insert({
        challenge_id: challengeId,
        pattern_type: patternType,
        pattern_data: patternData,
        confidence_score: Math.round(confidenceScore)
      });
  }
}

// Helper function
function calculateDuration(startTime: string, endTime: string): number {
  const [h1, m1] = startTime.split(':').map(Number);
  const [h2, m2] = endTime.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
}
