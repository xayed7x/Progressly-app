/**
 * Challenge Service
 * Handles CRUD operations for challenges
 */

import { getSupabaseBrowserClient } from '@/lib/supabase-client';
import type { 
  Challenge, 
  CreateChallengeInput, 
  ChallengeStatus 
} from '@/lib/types';

// Cast as any to bypass TypeScript checking for new tables
// TODO: Regenerate Supabase types after running migrations
const supabase: any = getSupabaseBrowserClient();

/**
 * Create a new challenge
 */
export async function createChallenge(
  userId: string,
  input: CreateChallengeInput
): Promise<Challenge> {
  // Calculate end date from start date and duration
  const startDate = new Date(input.start_date);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + input.duration_days - 1);

  const { data, error } = await supabase
    .from('challenges' as any)
    .insert({
      user_id: userId,
      name: input.name,
      start_date: input.start_date,
      end_date: endDate.toISOString().split('T')[0],
      duration_days: input.duration_days,
      commitments: input.commitments,
      identity_statement: input.identity_statement || null,
      why_statement: input.why_statement || null,
      obstacle_prediction: input.obstacle_prediction || null,
      success_threshold: input.success_threshold || 70,
      status: 'active'
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Error creating challenge:', error);
    throw new Error(error.message);
  }

  const challengeData = data as any;

  // Initialize first day metrics
  await initializeDayMetrics(challengeData.id, input.start_date, 1);

  return challengeData as Challenge;
}

/**
 * Get the active challenge for a user
 */
export async function getActiveChallenge(
  userId: string
): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from('challenges' as any)
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching active challenge:', error);
    throw new Error(error.message);
  }

  return data as Challenge;
}

/**
 * Get a challenge by ID
 */
export async function getChallengeById(
  challengeId: string
): Promise<Challenge | null> {
  const { data, error } = await supabase
    .from('challenges' as any)
    .select('*')
    .eq('id', challengeId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching challenge:', error);
    throw new Error(error.message);
  }

  return data as Challenge;
}

/**
 * Get all challenges for a user
 */
export async function getUserChallenges(
  userId: string
): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges' as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching challenges:', error);
    throw new Error(error.message);
  }

  return (data || []) as Challenge[];
}

/**
 * Update a challenge
 */
export async function updateChallenge(
  challengeId: string,
  updates: Partial<Omit<Challenge, 'id' | 'user_id' | 'created_at'>>
): Promise<Challenge> {
  const { data, error } = await supabase
    .from('challenges' as any)
    .update(updates as any)
    .eq('id', challengeId)
    .select()
    .single();

  if (error) {
    console.error('Error updating challenge:', error);
    throw new Error(error.message);
  }

  return data as Challenge;
}

/**
 * Mark a challenge as completed
 */
export async function completeChallenge(
  challengeId: string
): Promise<Challenge> {
  return updateChallenge(challengeId, { status: 'completed' });
}

/**
 * Abandon a challenge with optional reason
 */
export async function abandonChallenge(
  challengeId: string,
  reason?: string
): Promise<Challenge> {
  // Could store reason in a notes field or separate table
  return updateChallenge(challengeId, { status: 'abandoned' });
}

/**
 * Calculate the current day number for a challenge
 */
export function calculateDayNumber(
  startDate: string,
  currentDate: string = new Date().toISOString().split('T')[0]
): number {
  const start = new Date(startDate);
  const current = new Date(currentDate);
  const diffTime = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Day 1 is the start date
}

/**
 * Check if a challenge is still within its date range
 */
export function isChallengeActive(challenge: Challenge): boolean {
  if (challenge.status !== 'active') return false;
  
  const today = new Date().toISOString().split('T')[0];
  return today <= challenge.end_date;
}

/**
 * Initialize metrics for a specific day
 */
async function initializeDayMetrics(
  challengeId: string,
  date: string,
  dayNumber: number
): Promise<void> {
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  
  const { error } = await supabase
    .from('daily_challenge_metrics' as any)
    .insert({
      challenge_id: challengeId,
      date: date,
      day_number: dayNumber,
      commitments_status: {},
      overall_completion_pct: 0,
      consistency_score: 0,
      diligence_score: 0,
      cumulative_consistency_rate: 0,
      cumulative_diligence_rate: 0,
      day_of_week: dayOfWeek
    } as any);

  if (error && error.code !== '23505') { // Ignore unique constraint violation
    console.error('Error initializing day metrics:', error);
  }
}
